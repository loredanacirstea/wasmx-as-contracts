import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Bech32String, CallRequest, CallResponse } from "wasmx-env/assembly/types";
import { checkAuthorization } from "wasmx-env/assembly/utils";
import { hexToUint8Array, i32ToUint8ArrayBE, i64ToUint8ArrayBE } from "wasmx-utils/assembly/utils";
import { move } from "wasmx-erc20/assembly/actions";
import { setInfo, getInfo, getBalance, setBalance, getAllowance, setAllowance, getTotalSupply, setTotalSupply, getAdmins, getMinters } from "wasmx-erc20/assembly/storage";
import * as banktypes from "wasmx-bank/assembly/types";
import { MsgDelegate, MsgRedelegate, MsgUndelegate } from "./types";
import { revert } from "./utils";
import { addDelegatorToValidator, addValidatorToDelegator, setDelegatorToValidatorDelegation, addTotalDelegationToValidator, removeValidatorFromDelegator, removeDelegatorFromValidator, removeValidatorDelegationFromDelegator, removeDelegationAmountFromValidator, getDelegatorToValidatorDelegation } from "./storage";

// can only be called by the staking contract, which vets validators
export function delegate(req: MsgDelegate): ArrayBuffer {
    const caller = wasmxw.getCaller();
    const admins = getAdmins();
    let authorized = checkAuthorization(caller, admins);
    if (!authorized) {
        revert(`caller cannot delegate: ${caller}`);
    }

    // call bank to withdraw amount from delegator's account
    bankSendCoin(req.delegator, wasmxw.getCaller(), req.value)

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
    const caller = wasmxw.getCaller();
    const admins = getAdmins();
    let authorized = checkAuthorization(caller, admins);
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

    // call bank to withdraw amount from delegator's account
    bankSendCoin(wasmxw.getCaller(), req.delegator, req.value)

    return new ArrayBuffer(0);
}

export function redelegate(req: MsgRedelegate): ArrayBuffer {
    const caller = wasmxw.getCaller();
    const admins = getAdmins();
    let authorized = checkAuthorization(caller, admins);
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

function getCoin(value: i64): banktypes.Coin {
    const info = getInfo()
    return new banktypes.Coin(info.symbol, value)
}

function bankSendCoin (from: Bech32String, to: Bech32String, value: i64): void {
    const valuestr = JSON.stringify<banktypes.MsgSend>(new banktypes.MsgSend(from, to, [getCoin(value)]))
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
