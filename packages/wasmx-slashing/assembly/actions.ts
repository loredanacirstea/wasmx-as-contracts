import { JSON } from "json-as";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { DEFAULT_GAS_TX } from "wasmx-env/assembly/const";
import * as stakingtypes from "wasmx-stake/assembly/types";
import { decode as decodeBase64 } from "as-base64/assembly";
import { MODULE_NAME, GenesisState, QuerySigningInfoRequest, QuerySigningInfoResponse, ValidatorSigningInfo, MsgRunHook, QuerySigningInfosRequest, QuerySigningInfosResponse, QueryParamsRequest, Params, QueryParamsResponse, MissedBlockBitmapChunkSize, ValidatorUpdateDelay, Infraction, InfractionByEnum, QueryMissedBlockBitmapRequest, QueryMissedBlockBitmapResponse } from './types';
import { getParamsInternal, getParams, getValidatorSigningInfo, setParams, setValidatorSigningInfo, getValidatorSigningInfos, getMissedBlockBitmapChunk, setMissedBlockBitmapChunk, deleteMissedBlockBitmap } from "./storage";
import { LoggerDebug, LoggerError, LoggerInfo, revert } from "./utils";
import { Base64String, Bech32String, CallRequest, CallResponse, ConsensusAddressString, Event, EventAttribute, PageResponse } from "wasmx-env/assembly/types";
import { BigInt } from "wasmx-env/assembly/bn";
import { AttributeKeyAddress, AttributeKeyBurnedCoins, AttributeKeyHeight, AttributeKeyJailed, AttributeKeyMissedBlocks, AttributeKeyPower, AttributeKeyReason, AttributeValueMissingSignature, EventTypeLiveness, EventTypeSlash } from "./events";
import { parseDurationToMs } from "wasmx-utils/assembly/utils";

export function InitGenesis(req: GenesisState): ArrayBuffer {
    if (getParamsInternal() != "") {
        revert("already called initGenesis")
    }
    setParams(req.params)
    LoggerDebug(`init genesis`, ["missed_blocks", req.missed_blocks.length.toString(), "signing_infos", req.signing_infos.length.toString()])


    // store signing_infos
    for (let i = 0; i < req.signing_infos.length; i++) {
        const info = req.signing_infos[i];
        setValidatorSigningInfo(info.address, info.validator_signing_info)
    }

    // TODO store missed blocks ?

    return new ArrayBuffer(0);
}

export function AfterValidatorCreated(req: MsgRunHook): void {
    const data = String.UTF8.decode(decodeBase64(req.data).buffer)
    LoggerDebug("AfterValidatorCreated", ["data", data])
    const validator = JSON.parse<stakingtypes.Validator>(data)
    // TODO
    // consaddress => pubkey
    // consPk, err := validator.ConsPubKey()
	// if err != nil {
	// 	return err
	// }
    // h.k.AddPubkey(sdkCtx, consPk)
}

// AfterValidatorBonded updates the signing info start height or create a new signing info
export function AfterValidatorBonded(req: MsgRunHook): void {
    // TODO
    const data = String.UTF8.decode(decodeBase64(req.data).buffer)
    LoggerDebug("AfterValidatorBonded", ["data", data])
    const validator = JSON.parse<stakingtypes.Validator>(data)
    const consKey = validator.consensus_pubkey;
    if (consKey == null) {
        revert(`bonded validator missing consensus_pubkey: ${validator.operator_address}`)
        return
    }
    const vaddr = wasmxw.addr_humanize(decodeBase64(consKey.getKey().key).buffer)
    LoggerDebug("AfterValidatorBonded", ["validator_address", vaddr])
    let signingInfo = getValidatorSigningInfo(vaddr);
    const block = wasmxw.getCurrentBlock();
    if (!signingInfo) {
        signingInfo = new ValidatorSigningInfo(vaddr, block.height, 0, new Date(0), false, 0);
    } else {
        signingInfo.start_height = block.height;
    }
    setValidatorSigningInfo(vaddr, signingInfo);
}

// AfterValidatorRemoved deletes the address-pubkey relation when a validator is removed,
export function AfterValidatorRemoved(req: MsgRunHook): void {
    // TODO
	// return h.k.deleteAddrPubkeyRelation(ctx, crypto.Address(consAddr))
    const data = String.UTF8.decode(decodeBase64(req.data).buffer)
    LoggerDebug("AfterValidatorRemoved", ["data", data])
}

// callable by any user
export function Unjail(req: stakingtypes.MsgUnjail): ArrayBuffer {
    const consAddress = getConsensusAddress(req.address)

    // check unjail downtime
    const info = getValidatorSigningInfo(consAddress)
    if (info == null) {
        revert(`unjail: validator info not found: ${consAddress}`);
        return new ArrayBuffer(0);
    }
    if (info.jailed_until.getTime() > wasmxw.getTimestamp().getTime()) {
        revert(`unjail: jailed downtime not finished: ${info.jailed_until.toISOString()}`)
    }
    // cannot be unjailed if tombstoned
    if (info.tombstoned) {
        revert(`unjail: validator is tombstoned`);
    }

    info.jailed_until = new Date(0);
    setValidatorSigningInfo(consAddress, info);

    // just forward to staking
    UnjailStaking(req.address);
    return String.UTF8.encode(JSON.stringify<stakingtypes.MsgUnjailResponse>(new stakingtypes.MsgUnjailResponse()))
}

export function BeginBlock(req: MsgRunHook): void {
    const data = String.UTF8.decode(decodeBase64(req.data).buffer)
    LoggerDebug("BeginBlock", ["data", data])
    const block = JSON.parse<typestnd.RequestFinalizeBlock>(data)

    const params = getParams();
    const time = Date.fromString(block.time)

    for (let i = 0; i < block.decided_last_commit.votes.length; i++) {
        const vote = block.decided_last_commit.votes[i];
        HandleValidatorSignature(block.height, time, vote, params);
    }
}

export function GetParams(req: QueryParamsRequest): ArrayBuffer {
    return String.UTF8.encode(JSON.stringify<QueryParamsResponse>(new QueryParamsResponse(getParams())))
}

export function SigningInfo(req: QuerySigningInfoRequest): ArrayBuffer {
    const info = getValidatorSigningInfo(req.cons_address);
    if (!info) {
        revert(`SigningInfo not found for validator: ${req.cons_address}`)
        return new ArrayBuffer(0)
    }
    return String.UTF8.encode(JSON.stringify<QuerySigningInfoResponse>(new QuerySigningInfoResponse(info)))
}

export function SigningInfos(req: QuerySigningInfosRequest): ArrayBuffer {
    const infos = getValidatorSigningInfos();
    const resp = new QuerySigningInfosResponse(infos, new PageResponse(infos.length))
    return String.UTF8.encode(JSON.stringify<QuerySigningInfosResponse>(resp))
}

export function GetMissedBlockBitmap(req: QueryMissedBlockBitmapRequest): ArrayBuffer {
    const params = getParams()
    const parts = params.signed_blocks_window / MissedBlockBitmapChunkSize
    const rest = params.signed_blocks_window % MissedBlockBitmapChunkSize
    let chunkLen = i32(parts);
    if (rest > 0) chunkLen += 1;

    const chunks = new Array<Base64String>(chunkLen);
    for (let i = 0; i < chunkLen; i++) {
        const chunk = getMissedBlockBitmapChunk(req.cons_address, i);
        chunks[i] = base64.encode(chunk)
    }
    return String.UTF8.encode(JSON.stringify<QueryMissedBlockBitmapResponse>(new QueryMissedBlockBitmapResponse(chunks)))
}

export function HandleValidatorSignature(blockHeight: i64, blockTime: Date, vote: typestnd.VoteInfo, params: Params): void {
    // address is base64 encoded
    // we get the operator bech32 address
    const vaddr = wasmxw.addr_humanize(decodeBase64(vote.validator.address).buffer)
    const validator = getValidatorInfo(vaddr)
    const consKey = validator.consensus_pubkey
    if (consKey == null) {
        revert(`BeginBlock: validator missing consensus_pubkey: ${validator.operator_address}`)
        return
    }
    const consaddr = wasmxw.addr_humanize(decodeBase64(consKey.getKey().key).buffer)

    // don't update missed blocks when validator's jailed
    if (validator.jailed) {
        return;
    }

    const info = getValidatorSigningInfo(consaddr)
    if (!info) {
        revert(`validator info missing: ${consaddr}`);
        return
    }

    const signedBlocksWindow = params.signed_blocks_window
    if (signedBlocksWindow == i64(0)) {
        revert(`cannot have zero signed_blocks_window param`)
    }

    // Compute the relative index, so we count the blocks the validator *should*
	// have signed. We will use the 0-value default signing info if not present,
	// except for start height. The index is in the range [0, SignedBlocksWindow)
	// and is used to see if a validator signed a block at the given height, which
	// is represented by a bit in the bitmap.
	let index = info.index_offset % signedBlocksWindow
	info.index_offset++

	// determine if the validator signed the previous block
	const previous = GetMissedBlockBitmapValue(consaddr, i32(index))
    const missed = vote.block_id_flag == typestnd.BlockIDFlag.Absent

    if (!previous && missed) {
        // Bitmap value has changed from not missed to missed
        SetMissedBlockBitmapValue(consaddr, i32(index), true);
        info.missed_blocks_counter++;
    } else if (previous && !missed) {
        // Bitmap value has changed from missed to not missed
        SetMissedBlockBitmapValue(consaddr, i32(index), false);
        if (info.missed_blocks_counter > 0) {
            info.missed_blocks_counter--;
        }
    }

    setValidatorSigningInfo(consaddr, info);

    const minHeight = info.start_height + signedBlocksWindow;
    const minSignedPerWindow = getMinSignedPerWindow(params)
    const maxMissed = signedBlocksWindow - i64(minSignedPerWindow);

    if (missed) {
        wasmxw.emitCosmosEvents([
            new Event(
                EventTypeLiveness,
                [
                    new EventAttribute(AttributeKeyAddress, consaddr, true),
                    new EventAttribute(AttributeKeyMissedBlocks, info.missed_blocks_counter.toString(), true),
                    new EventAttribute(AttributeKeyHeight, blockHeight.toString(), true),
                ],
            )
        ]);
        LoggerDebug("absent validator", [
            "height", blockHeight.toString(),
			"validator", consaddr,
			"missed", info.missed_blocks_counter.toString(),
			"threshold", params.min_signed_per_window,
            "block_window", signedBlocksWindow.toString(),
            "max_missed", maxMissed.toString(),
        ])
    }

    // Emit punishment logic if necessary

    if (info.missed_blocks_counter > maxMissed && blockHeight > minHeight) {
        PunishValidator(blockHeight, blockTime, consaddr, params, validator, info, vote);
    }
}

function getMinSignedPerWindow(params: Params): i64 {
    const minSignedPerWindow: f64 = parseFloat(params.min_signed_per_window)
    return i64(minSignedPerWindow * f64(params.signed_blocks_window))
}

function GetMissedBlockBitmapValue(consaddr: string, index: i32): boolean {
    const chunkIndex = index / MissedBlockBitmapChunkSize;
    const chunk = getMissedBlockBitmapChunk(consaddr, chunkIndex);
    if (!chunk) return false;

    const bitIndex: i32 = index % MissedBlockBitmapChunkSize;
    const byteIndex: i32 = bitIndex >> 3; // Divide by 8
    const bitMask: u8 = (1 << u8(bitIndex % 8)) as u8;
    return (chunk[byteIndex] & bitMask) !== 0;
}

function SetMissedBlockBitmapValue(consaddr: string, index: i32, missed: boolean): void {
    const chunkIndex = index / MissedBlockBitmapChunkSize;
    let chunk = getMissedBlockBitmapChunk(consaddr, chunkIndex) || new Uint8Array(MissedBlockBitmapChunkSize / 8);

    const bitIndex: i32 = index % MissedBlockBitmapChunkSize;
    const byteIndex: i32 = bitIndex >> 3;
    const bitMask: u8 = 1 << u8(bitIndex % 8);

    if (missed) {
        chunk[byteIndex] |= bitMask; // Set the bit
    } else {
        chunk[byteIndex] &= ~bitMask; // Clear the bit
    }
    setMissedBlockBitmapChunk(consaddr, chunkIndex, chunk);
}

function PunishValidator(blockHeight: i64, blockTime: Date, consaddr: string, params: Params, validator: stakingtypes.Validator, info: ValidatorSigningInfo, vote: typestnd.VoteInfo): void {
    if (validator.jailed) {
        LoggerInfo("validator would have been slashed for downtime, but was either not found in store or already jailed", ["validator", consaddr])
        return;
    }

    // Downtime confirmed: slash and jail the validator
    // We need to retrieve the stake distribution which signed the block, so we subtract ValidatorUpdateDelay from the evidence height,
    // and subtract an additional 1 since this is the LastCommit.
    // Note that this *can* result in a negative "distributionHeight" up to -ValidatorUpdateDelay-1,
    // i.e. at the end of the pre-genesis block (none) = at the beginning of the genesis block.
    // That's fine since this is just used to filter unbonding delegations & redelegations.
    const distributionHeight = blockHeight - ValidatorUpdateDelay - 1;
    const coinsBurned = SlashWithInfractionReason(consaddr, distributionHeight, vote.validator.power, params.slash_fraction_downtime, Infraction.INFRACTION_DOWNTIME)

    wasmxw.emitCosmosEvents([
        new Event(
            EventTypeSlash,
            [
                new EventAttribute(AttributeKeyAddress, consaddr, true),
                new EventAttribute(AttributeKeyPower, vote.validator.power.toString(), true),
                new EventAttribute(AttributeKeyReason, AttributeValueMissingSignature, true),
                new EventAttribute(AttributeKeyJailed, consaddr, true),
                new EventAttribute(AttributeKeyBurnedCoins, coinsBurned.toString(), true),
            ],
        )
    ]);

    JailStaking(consaddr)

    // TODO ms??
    info.jailed_until = new Date(blockTime.getTime() + parseDurationToMs(params.downtime_jail_duration))

    // We need to reset the counter & bitmap so that the validator won't be
    // immediately slashed for downtime upon re-bonding.

    deleteMissedBlockBitmap(consaddr);
    info.missed_blocks_counter = 0;
    info.index_offset = 0
    setValidatorSigningInfo(consaddr, info);

    LoggerInfo("slashing and jailing validator due to liveness fault", [
        "height", blockHeight.toString(),
        "validator", validator.operator_address,
        "consaddress", consaddr,
        // "min_height", minHeight,
        // "threshold", minSignedPerWindow,
        // "slashed", slashFractionDowntime.String(),
        "jailed_until", info.jailed_until.toISOString(),
    ])
}

export function JailStaking(consaddr: string): void {
    const calldatastr = `{"Jail":{"consaddr":"${consaddr}"}}`;
    const resp = callStakingContract(calldatastr)
    if (resp.success > 0) {
        revert(`cannot jail validator: ${consaddr}`)
    }
}

export function UnjailStaking(operator: Bech32String): void {
    const calldatastr = `{"Unjail":{"address":"${operator}"}}`;
    const resp = callStakingContract(calldatastr)
    if (resp.success > 0) {
        revert(`cannot unjail validator: ${operator}`)
    }
}

export function getConsensusAddress(operator: Bech32String): ConsensusAddressString {
    const calldatastr = `{"ConsensusAddressByOperatorAddress":{"validator_addr":"${operator}"}}`;
    const resp = callStakingContract(calldatastr)
    if (resp.success > 0) {
        revert(`cannot get consensus address validator: ${operator}`)
    }
    const res = JSON.parse<stakingtypes.QueryConsensusAddressByOperatorAddressResponse>(resp.data)
    return res.consaddr;
}

export function SlashWithInfractionReason(consaddr: string, infractionHeight: i64, power: i64, slashFactor: string, infraction: Infraction): BigInt {
    const infractionReason = InfractionByEnum.get(infraction)
    const calldatastr = `{"SlashWithInfractionReason":{"consaddr":"${consaddr}","infractionHeight":${infractionHeight},"power":${power},"slashFactor":"${slashFactor}","infractionReason":"${infractionReason}"}}`;
    const resp = callStakingContract(calldatastr)
    if (resp.success > 0) {
        revert(`cannot slash validator: ${consaddr}`)
    }
    const response = JSON.parse<stakingtypes.MsgSlashWithInfractionReasonResponse>(resp.data)
    return response.amount_burned;
}

export function getValidatorInfo(addr: Bech32String): stakingtypes.Validator {
    const calldatastr = `{"GetValidator":{"validator_addr":"${addr}"}}`;
    const res = callStakingContract(calldatastr)
    const response = JSON.parse<stakingtypes.QueryValidatorResponse>(res.data)
    return response.validator;
}

export function callStakingContract(calldatastr: string): CallResponse {
    const resp = callContract("staking", calldatastr, false)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`staking call failed`, ["error", resp.data, "calldata", calldatastr])
    }
    return resp;
}

export function callContract(addr: Bech32String, calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest(addr, calldata, BigInt.zero(), DEFAULT_GAS_TX, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}
