import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as blocktypes from "wasmx-blocks/assembly/types";
import * as constypes from "wasmx-consensus/assembly/types_tendermint";
import * as stakingtypes from "wasmx-stake/assembly/types";
import { decode as decodeBase64 } from "as-base64/assembly";
import { MODULE_NAME, MsgInitGenesis, QuerySigningInfoRequest, QuerySigningInfoResponse, ValidatorSigningInfo, MsgRunHook, QuerySigningInfosRequest, QuerySigningInfosResponse, QueryParamsRequest, Params, QueryParamsResponse } from './types';
import { getParamsInternal, getParams, getValidatorSigningInfo, setParams, setValidatorSigningInfo, getValidatorSigningInfos } from "./storage";
import { LoggerDebug, LoggerError, revert } from "./utils";
import { Bech32String, CallRequest, CallResponse, PageResponse } from "wasmx-env/assembly/types";
import { BigInt } from "wasmx-env/assembly/bn";

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
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
    const vaddr = wasmxw.addr_humanize(decodeBase64(validator.consensus_pubkey.key).buffer)
    LoggerDebug("AfterValidatorBonded", ["validator_address", vaddr])
    let signingInfo = getValidatorSigningInfo(vaddr);
    const block = wasmxw.getCurrentBlock();
    const height = i64(block.height.toU64());
    if (!signingInfo) {
        signingInfo = new ValidatorSigningInfo(vaddr, height, 0, new Date(0), false, 0);
    } else {
        signingInfo.start_height = height;
    }
    setValidatorSigningInfo(vaddr, signingInfo!);
}

// AfterValidatorRemoved deletes the address-pubkey relation when a validator is removed,
export function AfterValidatorRemoved(req: MsgRunHook): void {
    // TODO
	// return h.k.deleteAddrPubkeyRelation(ctx, crypto.Address(consAddr))
    const data = String.UTF8.decode(decodeBase64(req.data).buffer)
    LoggerDebug("AfterValidatorRemoved", ["data", data])
}

export function BeginBlock(req: MsgRunHook): void {
    const data = String.UTF8.decode(decodeBase64(req.data).buffer)
    LoggerDebug("BeginBlock", ["data", data])
    const block = JSON.parse<typestnd.RequestFinalizeBlock>(data)

    const params = getParams();

    for (let i = 0; i < block.decided_last_commit.votes.length; i++) {
        const vote = block.decided_last_commit.votes[i];
        // address is base64 encoded
        // we get the operator bech32 address
        const vaddr = wasmxw.addr_humanize(decodeBase64(vote.validator.address).buffer)
        const validator = getValidatorInfo(vaddr)
        const consaddr = wasmxw.addr_humanize(decodeBase64(validator.consensus_pubkey.key).buffer)

        const info = getValidatorSigningInfo(consaddr)
        if (!info) {
            revert(`validator info missing: ${consaddr}`);
            return
        }

        // continue if validator voted
        if (vote.block_id_flag == typestnd.BlockIDFlag.Commit || vote.block_id_flag == typestnd.BlockIDFlag.Nil) {
            if (info.missed_blocks_counter > 0) {
            info.missed_blocks_counter = info.missed_blocks_counter - 1;
            setValidatorSigningInfo(consaddr, info);
            }
            continue;
        }

        // don't update missed blocks when validator's jailed
        if (validator.jailed) {
            continue
        }

        info.missed_blocks_counter = info.missed_blocks_counter + 1;
        setValidatorSigningInfo(consaddr, info);

        // TODO punishment
        // if (info.missed_blocks_counter >= params.signed_blocks_window) {
        // }

        // NOTE: RoundInt64 will never panic as minSignedPerWindow is
        //       less than 1.
        // return minSignedPerWindow.MulInt64(signedBlocksWindow).RoundInt64(), nil

        // if we are past the minimum height and the validator has missed too many blocks, punish them

        // coinsBurned, err := k.sk.SlashWithInfractionReason(ctx, consAddr, distributionHeight, power, slashFractionDowntime, stakingtypes.Infraction_INFRACTION_DOWNTIME)

        // emit event

        // jail & update validator info
        // We need to reset the counter & bitmap so that the validator won't be
        // immediately slashed for downtime upon re-bonding.
        // signInfo.MissedBlocksCounter = 0
    }
}

export function GetParams(req: QueryParamsRequest): ArrayBuffer {
    return String.UTF8.encode(JSON.stringify<QueryParamsResponse>(new QueryParamsResponse(getParams())))
}

export function SigningInfo(req: QuerySigningInfoRequest): ArrayBuffer {
    const info = getValidatorSigningInfo(req.consAddress);
    if (!info) {
        revert(`SigningInfo not found for validator: ${req.consAddress}`)
        return new ArrayBuffer(0)
    }
    return String.UTF8.encode(JSON.stringify<QuerySigningInfoResponse>(new QuerySigningInfoResponse(info)))
}

export function SigningInfos(req: QuerySigningInfosRequest): ArrayBuffer {
    const infos = getValidatorSigningInfos();
    const resp = new QuerySigningInfosResponse(infos, new PageResponse(infos.length))
    return String.UTF8.encode(JSON.stringify<QuerySigningInfosResponse>(resp))
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
    const req = new CallRequest(addr, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}
