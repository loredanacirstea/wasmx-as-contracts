import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { DEFAULT_GAS_TX } from "wasmx-env/assembly/const";
import { MsgRunHook } from "wasmx-hooks/assembly/types";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as banktypes from "wasmx-bank/assembly/types"
import * as stakingtypes from "wasmx-stake/assembly/types"
import * as blocktypes from "wasmx-blocks/assembly/types"
import * as erc20types from "wasmx-erc20/assembly/types"
import * as derc20types from "wasmx-derc20/assembly/types"
import { decode as decodeBase64, encode as encodeBase64 } from "as-base64/assembly";
import { Bech32String, CallRequest, CallResponse, Coin, DecCoin, PageRequest, ValidatorAddressString } from "wasmx-env/assembly/types";
import { BigInt } from "wasmx-env/assembly/bn";
import { FEE_COLLECTOR_ROLE, MODULE_NAME, MsgCommunityPoolSpend, MsgCommunityPoolSpendResponse, MsgDepositValidatorRewardsPool, MsgDepositValidatorRewardsPoolResponse, MsgFundCommunityPool, MsgFundCommunityPoolResponse, GenesisState, MsgSetWithdrawAddress, MsgSetWithdrawAddressResponse, MsgUpdateParams, MsgUpdateParamsResponse, MsgWithdrawDelegatorReward, MsgWithdrawDelegatorRewardResponse, MsgWithdrawValidatorCommission, MsgWithdrawValidatorCommissionResponse, QueryCommunityPoolRequest, QueryCommunityPoolResponse, QueryDelegationRewardsRequest, QueryDelegationRewardsResponse, QueryDelegationTotalRewardsRequest, QueryDelegationTotalRewardsResponse, QueryDelegatorValidatorsRequest, QueryDelegatorValidatorsResponse, QueryDelegatorWithdrawAddressRequest, QueryDelegatorWithdrawAddressResponse, QueryParamsRequest, QueryParamsResponse, QueryValidatorCommissionRequest, QueryValidatorCommissionResponse, QueryValidatorDistributionInfoRequest, QueryValidatorDistributionInfoResponse, QueryValidatorOutstandingRewardsRequest, QueryValidatorOutstandingRewardsResponse, QueryValidatorSlashesRequest, QueryValidatorSlashesResponse } from './types';
import * as types from "./types";
import { LoggerDebug, LoggerDebugExtended, LoggerError, revert } from "./utils";
import { getBaseDenom, getParams, getRewardsDenom, setBaseDenom, setParams, setRewardsDenom } from "./storage";
import { callContract } from "wasmx-env/assembly/utils";

export function InitGenesis(req: GenesisState): ArrayBuffer {
    setParams(req.params);
    setBaseDenom(req.base_denom);
    setRewardsDenom(req.rewards_denom);
    // TODO rest of genesis
    return new ArrayBuffer(0);
}

export function EndBlock(req: MsgRunHook): void {
    LoggerDebug("EndBlock", [])
    const block = JSON.parse<blocktypes.BlockEntry>(String.UTF8.decode(decodeBase64(req.data).buffer))

    // get fee collector balance
    const feeCollectorAddress = wasmxw.getAddressByRole(FEE_COLLECTOR_ROLE)
    const baseDenom = getBaseDenom()
    const fees = getBalance(feeCollectorAddress, baseDenom);
    if (fees.amount.isZero()) {
        return
    }
    // burn fee collector balance
    LoggerDebug("burn fee collector tokens", ["denom", baseDenom, "amount", fees.amount.toString()])
    const gasAddress = getTokenAddress(baseDenom)
    callBurnToken(gasAddress, feeCollectorAddress, fees.amount);

    // TODO community_tax * fees to CommunityPool

    const proposer = block.proposer_address;
    distributeFees(proposer, fees);
}

export function SetWithdrawAddress(req: MsgSetWithdrawAddress): ArrayBuffer {
    LoggerError("SetWithdrawAddress not implemented", [])
    return String.UTF8.encode(JSON.stringify<MsgSetWithdrawAddressResponse>(new MsgSetWithdrawAddressResponse()))
}

export function WithdrawDelegatorReward(req: MsgWithdrawDelegatorReward): ArrayBuffer {
    const baseDenom = getBaseDenom()
    const reward = withdrawRewards(req.delegator_address);
    return String.UTF8.encode(JSON.stringify<MsgWithdrawDelegatorRewardResponse>(new MsgWithdrawDelegatorRewardResponse([new Coin(baseDenom, reward)])))
}

export function WithdrawValidatorCommission(req: MsgWithdrawValidatorCommission): ArrayBuffer {
    const baseDenom = getBaseDenom()
    const validator = getValidatorByConsAddr(req.validator_address);
    const reward = withdrawRewards(validator.operator_address);
    return String.UTF8.encode(JSON.stringify<MsgWithdrawValidatorCommissionResponse>(new MsgWithdrawValidatorCommissionResponse([new Coin(baseDenom, reward)])))
}

export function FundCommunityPool(req: MsgFundCommunityPool): ArrayBuffer {
    LoggerError("FundCommunityPool not implemented", [])
    return String.UTF8.encode(JSON.stringify<MsgFundCommunityPoolResponse>(new MsgFundCommunityPoolResponse()))
}

export function UpdateParams(req: MsgUpdateParams): ArrayBuffer {
    setParams(req.params)
    return String.UTF8.encode(JSON.stringify<MsgUpdateParamsResponse>(new MsgUpdateParamsResponse()))
}

export function CommunityPoolSpend(req: MsgCommunityPoolSpend): ArrayBuffer {
    LoggerError("CommunityPoolSpend not implemented", [])
    return String.UTF8.encode(JSON.stringify<MsgCommunityPoolSpendResponse>(new MsgCommunityPoolSpendResponse()))
}

export function DepositValidatorRewardsPool(req: MsgDepositValidatorRewardsPool): ArrayBuffer {
    LoggerError("DepositValidatorRewardsPool not implemented", [])
    return String.UTF8.encode(JSON.stringify<MsgDepositValidatorRewardsPoolResponse>(new MsgDepositValidatorRewardsPoolResponse()))
}

export function Params(req: QueryParamsRequest): ArrayBuffer {
    const params = getParams()
    return String.UTF8.encode(JSON.stringify<QueryParamsResponse>(new QueryParamsResponse(params)))
}

export function ValidatorDistributionInfo(req: QueryValidatorDistributionInfoRequest): ArrayBuffer {
    revert(`ValidatorDistributionInfo not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryValidatorDistributionInfoResponse>(new QueryValidatorDistributionInfoResponse()))
}

export function ValidatorOutstandingRewards(req: QueryValidatorOutstandingRewardsRequest): ArrayBuffer {
    const rewardsDenom = getRewardsDenom();
    const tokenAddress = getTokenAddress(rewardsDenom);
    const reward = getTokenAmount(tokenAddress, req.validator_address);

    return String.UTF8.encode(JSON.stringify<QueryValidatorOutstandingRewardsResponse>(new QueryValidatorOutstandingRewardsResponse(new types.ValidatorOutstandingRewards([new DecCoin(rewardsDenom, reward)]))))
}

export function ValidatorCommission(req: QueryValidatorCommissionRequest): ArrayBuffer {
    // const validator = getValidatorByConsAddr(req.validator_address)
    // const commission = validator.commission.commission_rates.rate;
    const rewardsDenom = getRewardsDenom();
    const tokenAddress = getTokenAddress(rewardsDenom);
    const reward = getTokenAmount(tokenAddress, req.validator_address);

    return String.UTF8.encode(JSON.stringify<QueryValidatorCommissionResponse>(new QueryValidatorCommissionResponse(new types.ValidatorAccumulatedCommission([new DecCoin(rewardsDenom, reward)]))))
}

export function ValidatorSlashes(req: QueryValidatorSlashesRequest): ArrayBuffer {
    revert(`ValidatorSlashes not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryValidatorSlashesResponse>(new QueryValidatorSlashesResponse()))
}

// rewards for a delegator-validator pair
export function DelegationRewards(req: QueryDelegationRewardsRequest): ArrayBuffer {
    // const delegation = getDelegation(req.delegator_address, req.validator_address);
    // const rewards: DecCoin[] = [new DecCoin(delegation.balance.denom, delegation.balance.amount)];
    // we do not keep rewards per validator
    const rewards: DecCoin[] = []
    return String.UTF8.encode(JSON.stringify<QueryDelegationRewardsResponse>(new QueryDelegationRewardsResponse(rewards)))
}

// all rewards for a delegator, per validator
export function DelegationTotalRewards(req: QueryDelegationTotalRewardsRequest): ArrayBuffer {
    const rewardsDenom = getRewardsDenom();
    const tokenAddress = getTokenAddress(rewardsDenom);
    const reward = getTokenAmount(tokenAddress, req.delegator_address);

    return String.UTF8.encode(JSON.stringify<QueryDelegationTotalRewardsResponse>(new QueryDelegationTotalRewardsResponse([], [new DecCoin(rewardsDenom, reward)])))
}

export function DelegatorValidators(req: QueryDelegatorValidatorsRequest): ArrayBuffer {
    const validators = getDelegatorValidatorAddresses(req.delegator_address);

    return String.UTF8.encode(JSON.stringify<QueryDelegatorValidatorsResponse>(new QueryDelegatorValidatorsResponse(validators)))
}

export function DelegatorWithdrawAddress(req: QueryDelegatorWithdrawAddressRequest): ArrayBuffer {
    revert(`DelegatorWithdrawAddress not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryDelegatorWithdrawAddressResponse>(new QueryDelegatorWithdrawAddressResponse()))
}

export function CommunityPool(req: QueryCommunityPoolRequest): ArrayBuffer {
    revert(`CommunityPool not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryCommunityPoolResponse>(new QueryCommunityPoolResponse()))
}

export function withdrawRewards(delegatorAddress: Bech32String): BigInt {
    const baseDenom = getBaseDenom()
    const rewardsDenom = getRewardsDenom();
    const tokenAddress = getTokenAddress(rewardsDenom);
    const reward = getTokenAmount(tokenAddress, delegatorAddress);
    callBurnToken(tokenAddress, delegatorAddress, reward);

    // now mint amyt
    const gasTokenAddress = getTokenAddress(baseDenom);
    callMintToken(gasTokenAddress, delegatorAddress, reward);
    return reward
}

export function distributeFees(proposer: Bech32String, fees: Coin): void {
    LoggerDebug("distribute fees to block proposer", ["proposer", proposer, "denom", fees.denom, "amount", fees.amount.toString()])
    const rewardsDenom = getRewardsDenom();
    const validator = getValidator(proposer);
    const delegators = getValidatorDelegations(proposer);
    const commission = validator.commission.commission_rates.rate;
    const bigf = parseBigFloat(commission);

    const validAmount = fees.amount.mul(bigf.num).div(bigf.denom)
    const delegAmount = fees.amount.sub(validAmount);
    // store validator commission
    const tokenAddress = getTokenAddress(rewardsDenom)
    if (!validAmount.isZero()) {
        callMintToken(tokenAddress, validator.operator_address, validAmount)
    }

    for (let i = 0; i < delegators.length; i++) {
        const d = delegators[i]
        const dAmount = d.balance.amount.mul(delegAmount).div(validator.tokens)
        if (dAmount.isZero()) continue;
        callMintToken(tokenAddress, d.delegation.delegator_address, dAmount)
    }
}

export function getValidatorDelegations(addr: Bech32String): stakingtypes.DelegationResponse[] {
    const msg = JSON.stringify<stakingtypes.QueryValidatorDelegationsRequest>(new stakingtypes.QueryValidatorDelegationsRequest(addr, new PageRequest(0, 0, 0, true, false)))
    const calldata = `{"GetValidatorDelegations":${msg}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0 || resp.data === "") {
        revert(`could not get validator delegations: ${addr}`);
    }
    LoggerDebug("GetValidatorDelegations", ["address", addr, "data", resp.data])
    const result = JSON.parse<stakingtypes.QueryValidatorDelegationsResponse>(resp.data);
    return result.delegation_responses;
}

export function getDelegation(delegator: Bech32String, validator: ValidatorAddressString): stakingtypes.DelegationResponse {
    const msg = JSON.stringify<stakingtypes.QueryDelegationRequest>(new stakingtypes.QueryDelegationRequest(delegator, validator))
    const calldata = `{"GetDelegation":${msg}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0 || resp.data === "") {
        revert(`could not get delegation: ${delegator} - ${validator}`);
    }
    LoggerDebug("GetDelegation", ["delegator", delegator, "validator", validator])
    const result = JSON.parse<stakingtypes.QueryDelegationResponse>(resp.data);
    return result.delegation_response;
}

export function getDelegatorValidatorAddresses(delegator: Bech32String): Bech32String[] {
    const msg = JSON.stringify<stakingtypes.QueryDelegatorValidatorsRequest>(new stakingtypes.QueryDelegatorValidatorsRequest(delegator, new PageRequest(0, 0, 0, true, false)))
    const calldata = `{"GetDelegatorValidatorAddresses":${msg}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0 || resp.data === "") {
        revert(`could not get validators for: ${delegator}`);
    }
    LoggerDebug("GetDelegatorValidatorAddresses", ["delegator", delegator])
    const result = JSON.parse<derc20types.DelegatorValidatorsResponse>(resp.data);
    return result.validators;
}

export function getValidator(addr: Bech32String): stakingtypes.Validator {
    const msg = JSON.stringify<stakingtypes.QueryValidatorRequest>(new stakingtypes.QueryValidatorRequest(addr))
    const calldata = `{"GetValidator":${msg}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0 || resp.data === "") {
        revert(`could not get validator: ${addr}`);
    }
    LoggerDebugExtended("GetValidator", ["address", addr, "data", resp.data])
    const result = JSON.parse<stakingtypes.QueryValidatorResponse>(resp.data);
    return result.validator;
}

export function getValidatorByConsAddr(addr: ValidatorAddressString): stakingtypes.Validator {
    const msg = JSON.stringify<stakingtypes.QueryValidatorRequest>(new stakingtypes.QueryValidatorRequest(addr))
    const calldata = `{"ValidatorByConsAddr":${msg}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0 || resp.data === "") {
        revert(`could not get validator: ${addr}`);
    }
    LoggerDebugExtended("GetValidator", ["address", addr, "data", resp.data])
    const result = JSON.parse<stakingtypes.QueryValidatorResponse>(resp.data);
    return result.validator;
}

export function getBalance(address: Bech32String, denom: string): Coin {
    let calldata = new banktypes.QueryBalanceRequest(address, denom);
    let calldatastr = `{"GetBalance":${JSON.stringify<banktypes.QueryBalanceRequest>(calldata)}}`;
    let resp = callBank(calldatastr, true)
    if (resp.success > 0) {
        revert(`could not get balance for address: ${address}, denom: ${denom}: ${resp.data}`)
    }
    const balance = JSON.parse<banktypes.QueryBalanceResponse>(resp.data)
    return balance.balance;
}

export function callBank(calldata: string, isQuery: boolean): CallResponse {
    // TODO denom as alias! when we have alias contract
    const req = new CallRequest("bank", calldata, BigInt.zero(), DEFAULT_GAS_TX, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function callStaking(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest("staking", calldata, BigInt.zero(), DEFAULT_GAS_TX, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

// @ts-ignore
@serializable
export class BigFloat {
    num: BigInt
    denom: BigInt
    constructor( num: BigInt, denom: BigInt) {
        this.num = num
        this.denom = denom
    }
}

export function trimZerosEnd(value: string): string {
    let ndx = value.length - 1
    for (let i = value.length - 1; i >= 0; i--) {
        if (value.substring(i, i+1) != "0") {
            ndx = i;
            break;
        }
    }
    return value.substring(0, ndx + 1);
}

export function parseBigFloat(value: string): BigFloat {
    const parts = value.split(".");
    const integ = BigInt.fromString(parts[0])
    let num = BigInt.one()
    let denom = BigInt.one()
    if (parts.length > 1) {
        const trimmed = trimZerosEnd(parts[1])
        let ndx = 0;
        for (let i = 0; i < trimmed.length; i++) {
            if (trimmed.substring(i, i + 1) != "0") {
                ndx = i;
                break;
            }
        }
        const dec = trimmed.substring(ndx);
        num = BigInt.fromString(dec)
        denom = BigInt.fromU32(10).pown(trimmed.length);
    }
    num = num.add(integ.mul(denom))
    return new BigFloat(num, denom)
}

export function getTokenAddress(denom: string): Bech32String {
    const calldata = new banktypes.QueryAddressByDenom(denom);
    const calldatastr = `{"GetAddressByDenom":${JSON.stringify<banktypes.QueryAddressByDenom>(calldata)}}`;
    const resp = callBank(calldatastr, true)
    if (resp.success > 0) {
        revert(`could not get staking token address: ${resp.data}`)
    }
    const result = JSON.parse<banktypes.QueryAddressByDenomResponse>(resp.data)
    if (result.address == "") {
        revert(`could not find rewards token address: ${denom}`)
    }
    return result.address
}

export function callMintToken(tokenAddress: Bech32String, to: Bech32String, value: BigInt): void {
    const calldata = new erc20types.MsgMint(to, value);
    const calldatastr = `{"mint":${JSON.stringify<erc20types.MsgMint>(calldata)}}`;
    const resp = callContract(tokenAddress, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`could not mint token: ${tokenAddress}`)
    }
}

export function callBurnToken(tokenAddress: Bech32String, from: Bech32String, value: BigInt): void {
    const calldata = new erc20types.MsgBurn(from, value);
    const calldatastr = `{"burn":${JSON.stringify<erc20types.MsgBurn>(calldata)}}`;
    const resp = callContract(tokenAddress, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`could not burn token: ${tokenAddress}: ${resp.data}`)
    }
}

export function getTokenAmount(tokenAddress: Bech32String, addr: Bech32String): BigInt {
    const calldata = new erc20types.MsgBalanceOf(addr);
    const calldatastr = `{"balanceOf":${JSON.stringify<erc20types.MsgBalanceOf>(calldata)}}`;
    const resp = callContract(tokenAddress, calldatastr, true, MODULE_NAME)
    if (resp.success > 0) {
        revert(`could not burn rewards`)
    }
    const result = JSON.parse<erc20types.MsgBalanceOfResponse>(resp.data);
    return result.balance.amount
}
