import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Bech32String, CallRequest, CallResponse } from "wasmx-env/assembly/types";
import { isAuthorized } from "wasmx-env/assembly/utils";
import { hexToUint8Array, i32ToUint8ArrayBE, i64ToUint8ArrayBE } from "wasmx-utils/assembly/utils";
import { QueryDelegationRequest, QueryDelegationResponse, Delegation, DelegationResponse, Coin, DelegationCosmos, CoinCosmos } from "wasmx-stake/assembly/types";
import { move } from "wasmx-erc20/assembly/actions";
import { setInfo, getInfo, getBalance, setBalance, getAllowance, setAllowance, getTotalSupply, setTotalSupply, getAdmins, getMinters } from "wasmx-erc20/assembly/storage";
import * as banktypes from "wasmx-bank/assembly/types";
import { MsgDelegate, MsgGetAllSDKDelegations, MsgRedelegate, MsgUndelegate, SDKDelegations } from "./types";
import { LoggerDebug, revert } from "./utils";
import { addDelegatorToValidator, addValidatorToDelegator, setDelegatorToValidatorDelegation, addTotalDelegationToValidator, removeValidatorFromDelegator, removeDelegatorFromValidator, removeValidatorDelegationFromDelegator, removeDelegationAmountFromValidator, getDelegatorToValidatorDelegation } from "./storage";

// TODO this must be in genesis
const DENOM_BASE = "amyt"

// can only be called by the staking contract, which vets validators
export function delegate(req: MsgDelegate): ArrayBuffer {
    LoggerDebug(`delegating`, ["delegator", req.delegator, "validator", req.validator, "value", req.value.toString()])
    const caller = wasmxw.getCaller();
    const admins = getAdmins();
    let authorized = isAuthorized(caller, admins);
    if (!authorized) {
        revert(`caller cannot delegate: ${caller}`);
    }

    // call bank to withdraw amount from delegator's account
    bankSendCoin(req.delegator, wasmxw.getCaller(), req.value, DENOM_BASE)

    // add to delegator's balance
    let balance = getBalance(req.delegator);
    balance += i64(req.value);
    setBalance(req.delegator, balance);
    // increase staked supply
    let supply = getTotalSupply();
    supply += i64(req.value);
    setTotalSupply(supply);

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
    balance -= i64(req.value);
    setBalance(req.delegator, balance);
    // decrease staked supply
    let supply = getTotalSupply();
    if (supply < req.value) revert("underflow")
    supply -= i64(req.value);
    setTotalSupply(supply);

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

    // call bank to give back amount to delegator's account
    bankSendCoin(wasmxw.getAddress(), req.delegator, req.value, DENOM_BASE)

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
    const delegations: SDKDelegations[] = [];
    revert("not implemented yet")
    return new ArrayBuffer(0)
}

export function GetDelegation(req: QueryDelegationRequest): ArrayBuffer {
    const amount = getDelegatorToValidatorDelegation(req.delegator_addr, req.validator_addr)
    const delegation = new DelegationCosmos(req.delegator_addr, req.validator_addr, amount.toString())
    const data = new QueryDelegationResponse(new DelegationResponse(delegation, getCoin(amount)))
    return String.UTF8.encode(JSON.stringify<QueryDelegationResponse>(data))
}

function getCoin(value: i64): CoinCosmos {
    const info = getInfo()
    return new CoinCosmos(info.symbol, value.toString())
}

function bankSendCoin (from: Bech32String, to: Bech32String, value: i64, denom: string): void {
    const valuestr = JSON.stringify<banktypes.MsgSend>(new banktypes.MsgSend(from, to, [new banktypes.Coin(denom, value)]))
    const calldata = `{"Send":${valuestr}}`
    const resp = callBank(calldata, false);
    if (resp.success > 0) {
        revert("could not transfer coins by bank");
    }
}

function callBank(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest("bank", calldata, 0, 100000000, isQuery);
    const resp = wasmxw.call(req);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}
