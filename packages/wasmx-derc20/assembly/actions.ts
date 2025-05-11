import { JSON } from "json-as";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { DEFAULT_GAS_TX } from "wasmx-env/assembly/const";
import { Bech32String, CallRequest, CallResponse, Coin, PageResponse } from "wasmx-env/assembly/types";
import { isAuthorized } from "wasmx-env/assembly/utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { QueryDelegationRequest, QueryDelegationResponse, Delegation, DelegationResponse, DelegationCosmos, QueryValidatorDelegationsRequest, QueryValidatorDelegationsResponse, QueryDelegatorValidatorsRequest, QueryDelegatorValidatorsResponse, Validator } from "wasmx-stake/assembly/types";
import { move } from "wasmx-erc20/assembly/actions";
import { setInfo, getInfo, getBalance, setBalance, getAllowance, setAllowance, getTotalSupply, setTotalSupply, getAdmins, getMinters, setAdmins, setMinters } from "wasmx-erc20/assembly/storage";
import * as banktypes from "wasmx-bank/assembly/types";
import { DelegatorValidatorsResponse, MODULE_NAME, MsgDelegate, MsgGetAllSDKDelegations, MsgRedelegate, MsgUndelegate, SDKDelegation } from "./types";
import { LoggerDebug, revert } from "./utils";
import { addDelegatorToValidator, addValidatorToDelegator, setDelegatorToValidatorDelegation, addTotalDelegationToValidator, removeValidatorFromDelegator, removeDelegatorFromValidator, removeValidatorDelegationFromDelegator, removeDelegationAmountFromValidator, getDelegatorToValidatorDelegation, getBalanceValidator, setBalanceValidator, getValidatorToDelegators, getDelegatorToValidators, setBaseDenom, getBaseDenom } from "./storage";
import { MsgBalanceOf, MsgBalanceOfResponse, TokenInfo, CallDataInstantiate } from "wasmx-erc20/assembly/types";

export function instantiateToken(): void {
    const calldraw = wasmx.getCallData();
    const calldrawstr = String.UTF8.decode(calldraw);
    LoggerDebug("instantiate token", ["args", calldrawstr])
    const calld = JSON.parse<CallDataInstantiate>(calldrawstr);
    setAdmins(calld.admins)
    let minters = calld.minters
    if (minters.length == 0) {
      minters = [wasmxw.getCaller()]
    }
    setMinters(minters);
    setInfo(new TokenInfo(calld.name, calld.symbol, calld.decimals));
    setBaseDenom(calld.base_denom);
}

export function balanceOfValidator(req: MsgBalanceOf): ArrayBuffer {
    const value = getBalanceValidator(req.owner)
    const info = getInfo()
    return String.UTF8.encode(JSON.stringify<MsgBalanceOfResponse>(new MsgBalanceOfResponse(new Coin(info.symbol, value))))
}

// can only be called by the staking contract, which vets validators
export function delegate(req: MsgDelegate): ArrayBuffer {
    LoggerDebug(`delegating`, ["delegator", req.delegator, "validator", req.validator, "value", req.value.toString()])
    const caller = wasmxw.getCaller();
    const admins = getAdmins();
    let authorized = isAuthorized(caller, admins);
    if (!authorized) {
        revert(`caller cannot delegate: ${caller}`);
    }
    const baseDenom = getBaseDenom()

    // call bank to withdraw amount from delegator's account
    bankSendCoin(req.delegator, wasmxw.getCaller(), req.value, baseDenom)

    // add to delegator's balance
    let balance = getBalance(req.delegator);
    // @ts-ignore
    balance += req.value;
    setBalance(req.delegator, balance);
    // increase staked supply
    let supply = getTotalSupply();
    // @ts-ignore
    supply += req.value;
    setTotalSupply(supply);
    // add to validator's balance
    // @ts-ignore
    const vbal: BigInt = getBalanceValidator(req.validator) + req.value;
    setBalanceValidator(req.validator, vbal);

    // add validator to delegator's list
    addValidatorToDelegator(req.delegator, req.validator)
    // add delegator to validator's list
    addDelegatorToValidator(req.validator, req.delegator)
    // individual delegation amount
    setDelegatorToValidatorDelegation(req.delegator, req.validator, req.value)
    // add to validator's total delegation
    addTotalDelegationToValidator(req.validator, req.value)
    return new ArrayBuffer(0);
}

export function undelegate(req: MsgUndelegate): ArrayBuffer {
    LoggerDebug(`undelegate`, ["delegator", req.delegator, "validator", req.validator, "value", req.value.toString()])
    const caller = wasmxw.getCaller();
    const admins = getAdmins();
    let authorized = isAuthorized(caller, admins);
    if (!authorized) {
        revert(`caller cannot undelegate: ${caller}`);
    }

    // sub delegator's balance
    let balance = getBalance(req.delegator);
    if (balance < req.value) revert("underflow")
    // @ts-ignore
    balance -= req.value;
    setBalance(req.delegator, balance);
    // decrease staked supply
    let supply = getTotalSupply();
    if (supply < req.value) revert("underflow")
    // @ts-ignore
    supply -= req.value;
    setTotalSupply(supply);
    // sub to validator's balance
    // @ts-ignore
    const vbal: BigInt = getBalanceValidator(req.validator) - req.value;
    setBalanceValidator(req.validator, vbal);

    const delegation = getDelegatorToValidatorDelegation(req.delegator, req.validator)
    if (delegation == req.value) {
        // remove validator from delegator's list
        removeValidatorFromDelegator(req.delegator, req.validator)
        // remove delegator from validator's list
        removeDelegatorFromValidator(req.validator, req.delegator)
    }

    // individual delegation amount
    removeValidatorDelegationFromDelegator(req.delegator, req.validator, req.value)
    // remove from validator's total delegation
    removeDelegationAmountFromValidator(req.validator, req.value)

    const baseDenom = getBaseDenom()

    // call bank to give back amount to delegator's account
    bankSendCoin(wasmxw.getAddress(), req.delegator, req.value, baseDenom)

    return new ArrayBuffer(0);
}

export function redelegate(req: MsgRedelegate): ArrayBuffer {
    LoggerDebug(`redelegate`, ["delegator", req.delegator, "validatorSource", req.validatorSource, "validatorDestination", req.validatorDestination, "value", req.value.toString()])
    const caller = wasmxw.getCaller();
    const admins = getAdmins();
    let authorized = isAuthorized(caller, admins);
    if (!authorized) {
        revert(`caller cannot redelegate: ${caller}`);
    }

    const delegation = getDelegatorToValidatorDelegation(req.delegator, req.validatorSource)
    if (delegation == req.value) {
        // remove validator from delegator's list
        removeValidatorFromDelegator(req.delegator, req.validatorSource)
        // remove delegator from validator's list
        removeDelegatorFromValidator(req.validatorSource, req.delegator)
    }

    // @ts-ignore
    const vbalS: BigInt = getBalanceValidator(req.validatorSource) - req.value;
    setBalanceValidator(req.validatorSource, vbalS);
    // @ts-ignore
    const vbalD: BigInt = getBalanceValidator(req.validatorDestination) + req.value;
    setBalanceValidator(req.validatorDestination, vbalD);

    // individual delegation amount
    removeValidatorDelegationFromDelegator(req.delegator, req.validatorSource, req.value)
    // remove from validator's total delegation
    removeDelegationAmountFromValidator(req.validatorSource, req.value)

    // add validator to delegator's list
    addValidatorToDelegator(req.delegator, req.validatorDestination)
    // add delegator to validator's list
    addDelegatorToValidator(req.validatorDestination, req.delegator)
    // individual delegation amount
    setDelegatorToValidatorDelegation(req.delegator, req.validatorDestination, req.value)
    // add to validator's total delegation
    addTotalDelegationToValidator(req.validatorDestination, req.value)

    return new ArrayBuffer(0);
}

export function GetAllSDKDelegations(req: MsgGetAllSDKDelegations): ArrayBuffer {
    const delegations: SDKDelegation[] = [];
    revert("not implemented yet")
    return new ArrayBuffer(0)
}

export function GetDelegation(req: QueryDelegationRequest): ArrayBuffer {
    const amount = getDelegatorToValidatorDelegation(req.delegator_addr, req.validator_addr)
    const delegation = new DelegationCosmos(req.delegator_addr, req.validator_addr, amount)
    const data = new QueryDelegationResponse(new DelegationResponse(delegation, getCoin(amount)))
    return String.UTF8.encode(JSON.stringify<QueryDelegationResponse>(data))
}

export function GetValidatorDelegations(req: QueryValidatorDelegationsRequest): ArrayBuffer {
    // TODO pagination of delegators
    const delegators = getValidatorToDelegators(req.validator_addr)
    const delegations = new Array<DelegationResponse>(delegators.length);
    for (let i = 0; i < delegators.length; i++) {
        const delegator = delegators[i]
        const delegation = getDelegatorToValidatorDelegation(delegator, req.validator_addr)
        delegations[i] = new DelegationResponse(
            new DelegationCosmos(delegator, req.validator_addr, delegation),
            getCoin(delegation),
        )
    }
    return String.UTF8.encode(JSON.stringify<QueryValidatorDelegationsResponse>(new QueryValidatorDelegationsResponse(delegations, new PageResponse(delegations.length))))
}

export function GetDelegatorValidators(req: QueryDelegatorValidatorsRequest): ArrayBuffer {
    // TODO pagination of validators
    const validatorAddresses = getDelegatorToValidators(req.delegator_addr)
    return String.UTF8.encode(JSON.stringify<DelegatorValidatorsResponse>(new DelegatorValidatorsResponse(validatorAddresses, new PageResponse(validatorAddresses.length))))
}

function getCoin(value: BigInt): Coin {
    const info = getInfo()
    return new Coin(info.symbol, value)
}

function bankSendCoin (from: Bech32String, to: Bech32String, value: BigInt, denom: string): void {
    const valuestr = JSON.stringify<banktypes.MsgSend>(new banktypes.MsgSend(from, to, [new Coin(denom, value)]))
    const calldata = `{"SendCoins":${valuestr}}`
    const resp = callBank(calldata, false);
    if (resp.success > 0) {
        revert(`could not transfer coins by bank: ${resp.data}`);
    }
}

function callBank(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest("bank", calldata, BigInt.zero(), DEFAULT_GAS_TX, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}
