import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { checkAuthorization } from "wasmx-env/assembly/utils";
import { Bech32String } from "wasmx-env/assembly/types";
import { hexToUint8Array, i32ToUint8ArrayBE, i64ToUint8ArrayBE } from "wasmx-utils/assembly/utils";
import { setInfo, getInfo, getBalance, setBalance, getAllowance, setAllowance, getTotalSupply, setTotalSupply, getAdmins, getMinters, setMinters, setAdmins } from "./storage";
import { MsgAllowance, MsgAllowanceResponse, MsgApprove, MsgBalanceOf, MsgBalanceOfResponse, MsgDecimalsResponse, MsgMint, MsgNameResponse, MsgSymbolResponse, MsgTotalSupplyResponse, MsgTransfer, MsgTransferFrom, MsgTransferFromResponse, MsgTransferResponse } from "./types";
import { LoggerDebug, revert } from "./utils";
import { CallDataInstantiate, TokenInfo } from "./types";

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
}

export function getName(): ArrayBuffer {
    const value = getInfo()
    return String.UTF8.encode(JSON.stringify<MsgNameResponse>(new MsgNameResponse(value.name)))
}

export function getSymbol(): ArrayBuffer {
    const value = getInfo()
    return String.UTF8.encode(JSON.stringify<MsgSymbolResponse>(new MsgSymbolResponse(value.symbol)))
}

export function getDecimals(): ArrayBuffer {
    const value = getInfo()
    return String.UTF8.encode(JSON.stringify<MsgDecimalsResponse>(new MsgDecimalsResponse(value.decimals)))
}

export function totalSupply(): ArrayBuffer {
    const value = getTotalSupply()
    return String.UTF8.encode(JSON.stringify<MsgTotalSupplyResponse>(new MsgTotalSupplyResponse(value)))
}

export function balanceOf(req: MsgBalanceOf): ArrayBuffer {
    const value = getBalance(req.owner)
    return String.UTF8.encode(JSON.stringify<MsgBalanceOfResponse>(new MsgBalanceOfResponse(value)))
}

export function transfer(req: MsgTransfer): ArrayBuffer {
    const from = wasmxw.getCaller();
    const success = move(from, req.to, req.value);
    return String.UTF8.encode(JSON.stringify<MsgTransferResponse>(new MsgTransferResponse(success)))
}

export function transferFrom(req: MsgTransferFrom): ArrayBuffer {
    const spender = wasmxw.getCaller();
    const admins = getAdmins();
    const authorized = checkAuthorization(spender, admins);
    let success = false;
    if (authorized) {
        success = move(req.from, req.to, req.value)
    } else {
        let allow = getAllowance(req.from, spender)
        if (allow >= req.value) {
            success = move(req.from, req.to, req.value)
            allow -= req.value;
            setAllowance(req.from, spender, allow);
        }
    }
    return String.UTF8.encode(JSON.stringify<MsgTransferFromResponse>(new MsgTransferFromResponse(success)))
}

export function approve(req: MsgApprove): ArrayBuffer {
    const owner = wasmxw.getCaller();
    let allowance = getAllowance(owner, req.spender);
    allowance += req.value;
    setAllowance(owner, req.spender, allowance);
    return new ArrayBuffer(0);
}

export function allowance(req: MsgAllowance): ArrayBuffer {
    const value = getAllowance(req.owner, req.spender)
    return String.UTF8.encode(JSON.stringify<MsgAllowanceResponse>(new MsgAllowanceResponse(value)))
}

export function mint(req: MsgMint): ArrayBuffer {
    const caller = wasmxw.getCaller();
    const minters = getMinters();
    let authorized = checkAuthorization(caller, minters);
    if (!authorized) {
        revert(`caller cannot mint: ${caller}`);
    }
    let balance = getBalance(req.to);
    balance += i64(req.value);
    setBalance(req.to, balance);
    let supply = getTotalSupply();
    supply += i64(req.value);
    setTotalSupply(supply);
    return new ArrayBuffer(0);
}

export function move(from: Bech32String, to: Bech32String, amount: i64): boolean {
    let balanceFrom = getBalance(from);
    if (balanceFrom < amount) {
        return false;
    }
    let balanceTo = getBalance(to);
    balanceFrom -= i64(amount);
    balanceTo += i64(amount);
    setBalance(from, balanceFrom);
    logTransfer(from, to, amount);
    setBalance(to, balanceTo);
    return true;
}

export function logTransfer(from: Bech32String, to: Bech32String, amount: i64): void {
    const topic1 = hexToUint8Array(from);
    const topic2 = hexToUint8Array(to);
    const topic3 = hexToUint8Array(amount.toString(16));
    wasmxw.log_fsm(new Uint8Array(0), [topic1, topic2, topic3]);
}

