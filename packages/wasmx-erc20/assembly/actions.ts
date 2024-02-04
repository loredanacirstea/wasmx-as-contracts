import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { isAuthorized } from "wasmx-env/assembly/utils";
import { Bech32String } from "wasmx-env/assembly/types";
import { BigInt } from "wasmx-env/assembly/bn";
import { hexToUint8Array } from "wasmx-utils/assembly/utils";
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
    LoggerDebug("transfer", ["from", from, "to", req.to, "value", req.value.toString()])
    const success = move(from, req.to, req.value);
    return String.UTF8.encode(JSON.stringify<MsgTransferResponse>(new MsgTransferResponse(success)))
}

export function transferFrom(req: MsgTransferFrom): ArrayBuffer {
    const spender = wasmxw.getCaller();
    const admins = getAdmins();
    const authorized = isAuthorized(spender, admins);
    LoggerDebug("transferFrom", ["from", req.from, "to", req.to, "value", req.value.toString(), "caller", spender, "authorized", authorized.toString()])
    let success = false;
    if (authorized) {
        success = move(req.from, req.to, req.value)
    } else {
        let allow = getAllowance(req.from, spender)
        if (allow >= req.value) {
            success = move(req.from, req.to, req.value)
            // @ts-ignore
            allow -= req.value;
            setAllowance(req.from, spender, allow);
        }
    }
    return String.UTF8.encode(JSON.stringify<MsgTransferFromResponse>(new MsgTransferFromResponse(success)))
}

export function approve(req: MsgApprove): ArrayBuffer {
    const owner = wasmxw.getCaller();
    let allowance = getAllowance(owner, req.spender);
    // @ts-ignore
    allowance += req.value;
    setAllowance(owner, req.spender, allowance);
    logApproval(owner, req.spender, req.value)
    return new ArrayBuffer(0);
}

export function allowance(req: MsgAllowance): ArrayBuffer {
    const value = getAllowance(req.owner, req.spender)
    return String.UTF8.encode(JSON.stringify<MsgAllowanceResponse>(new MsgAllowanceResponse(value)))
}

export function mint(req: MsgMint): ArrayBuffer {
    const caller = wasmxw.getCaller();
    const minters = getMinters();
    let authorized = isAuthorized(caller, minters);
    if (!authorized) {
        revert(`caller cannot mint: ${caller}`);
    }
    LoggerDebug("mint", ["to", req.to, "value", req.value.toString(), "authorized", authorized.toString()])
    let balance = getBalance(req.to);
    // @ts-ignore
    balance += req.value;
    setBalance(req.to, balance);
    let supply = getTotalSupply();
    // @ts-ignore
    supply += req.value;
    setTotalSupply(supply);
    return new ArrayBuffer(0);
}

export function move(from: Bech32String, to: Bech32String, amount: BigInt): boolean {
    let balanceFrom = getBalance(from);
    if (balanceFrom < amount) {
        LoggerDebug("cannot move coins", ["from", from, "to", to, "balanceFrom", balanceFrom.toString(), "value", amount.toString()])
        return false;
    }
    let balanceTo = getBalance(to);
    // @ts-ignore
    balanceFrom -= amount;
    // @ts-ignore
    balanceTo += amount;
    setBalance(from, balanceFrom);
    logTransfer(from, to, amount);
    setBalance(to, balanceTo);
    return true;
}

export function logTransfer(from: Bech32String, to: Bech32String, amount: BigInt): void {
    const topic0str = `Transfer(address,address,uint256)`
    const topic1 = hexToUint8Array(from);
    const topic2 = hexToUint8Array(to);
    const topic3 = hexToUint8Array(amount.toString(16));
    wasmxw.logWithMsgTopic(topic0str, new Uint8Array(0), [topic1, topic2, topic3]);
}

export function logApproval(owner: Bech32String, spender: Bech32String, amount: BigInt): void {
    const topic0str = `Approval(address,address,uint256)`
    const topic1 = hexToUint8Array(owner);
    const topic2 = hexToUint8Array(spender);
    const topic3 = hexToUint8Array(amount.toString(16));
    wasmxw.logWithMsgTopic(topic0str, new Uint8Array(0), [topic1, topic2, topic3]);
}

