import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Bech32String, Coin } from "wasmx-env/assembly/types";
import { BigInt } from "wasmx-env/assembly/bn";
import { hexToUint8Array32 } from "wasmx-utils/assembly/utils";
import { getTokenFieldValue, getOwnedFieldValue, setTokenFieldValues, moveToken, addSupply, addToken, insertTokenFieldValues, insertOwnedFieldValues, setRecordId, assetExists, getPermissionFieldValue, subPermission, addPermission, insertPermissionFieldValues, permissionExists } from "./dtype";
import { MsgAllowance, MsgAllowanceResponse, MsgApprove, MsgBalanceOf, MsgBalanceOfResponse, MsgDecimalsResponse, MsgNameResponse, MsgSymbolResponse, MsgTotalSupplyResponse, MsgTransfer, MsgTransferFrom, MsgTransferFromResponse, MsgTransferResponse } from "./types";
import { LoggerDebug, revert } from "./utils";
import { CallDataInstantiate } from "./types";

export function instantiateToken(calld: CallDataInstantiate): void {
    const recordId = insertTokenFieldValues(["name", "symbol", "decimals", "total_supply"], [calld.name, calld.symbol, calld.decimals.toString(), calld.total_supply.toString()]);
    setRecordId(recordId);

    // assign supply to creator
    const owner = wasmxw.getCaller()
    insertOwnedFieldValues(owner, calld.total_supply)
}

export function getName(): ArrayBuffer {
    const value = getTokenFieldValue("name")
    return String.UTF8.encode(JSON.stringify<MsgNameResponse>(new MsgNameResponse(value)))
}

export function getSymbol(): ArrayBuffer {
    const value = getTokenFieldValue("symbol")
    return String.UTF8.encode(JSON.stringify<MsgSymbolResponse>(new MsgSymbolResponse(value)))
}

export function getDecimals(): ArrayBuffer {
    const value = getTokenFieldValue("decimals")
    const decimals = i32(parseInt(value, 10))
    return String.UTF8.encode(JSON.stringify<MsgDecimalsResponse>(new MsgDecimalsResponse(decimals)))
}

export function totalSupply(): ArrayBuffer {
    const symbol = getTokenFieldValue("symbol")
    const value = getTokenFieldValue("total_supply")
    const supply = BigInt.fromString(value)
    return String.UTF8.encode(JSON.stringify<MsgTotalSupplyResponse>(new MsgTotalSupplyResponse(new Coin(symbol, supply))))
}

export function balanceOf(req: MsgBalanceOf): ArrayBuffer {
    const symbol = getTokenFieldValue("symbol")
    const value = getOwnedFieldValue("amount", req.owner)
    const balance = BigInt.fromString(value)
    return String.UTF8.encode(JSON.stringify<MsgBalanceOfResponse>(new MsgBalanceOfResponse(new Coin(symbol, balance))))
}

export function transfer(req: MsgTransfer): ArrayBuffer {
    console.log("--transfer--" + req.to)
    const from = wasmxw.getCaller();

    if (!assetExists(req.to)) {
        console.log("--insertOwnedFieldValues--" + req.to)
        insertOwnedFieldValues(req.to, BigInt.zero())
    }

    LoggerDebug("transfer", ["from", from, "to", req.to, "value", req.value.toString()])
    console.log("--moveToken--")
    moveToken(from, req.to, req.value);
    logTransfer(from, req.to, req.value);
    return String.UTF8.encode(JSON.stringify<MsgTransferResponse>(new MsgTransferResponse()))
}

export function transferFrom(req: MsgTransferFrom): ArrayBuffer {
    const spender = wasmxw.getCaller();
    const value = getPermissionFieldValue("amount", req.from, spender)
    const allow = BigInt.fromString(value)
    if (allow < req.value) {
        revert(`not enough allowance`)
    }
    moveToken(req.from, req.to, req.value)
    subPermission(req.from, spender, req.value);
    return String.UTF8.encode(JSON.stringify<MsgTransferFromResponse>(new MsgTransferFromResponse()))
}

export function approve(req: MsgApprove): ArrayBuffer {
    const owner = wasmxw.getCaller();
    if (!permissionExists(owner, req.spender)) {
        insertPermissionFieldValues(owner, req.spender, BigInt.zero())
    }
    addPermission(owner, req.spender, req.value);
    logApproval(owner, req.spender, req.value)
    return new ArrayBuffer(0);
}

export function allowance(req: MsgAllowance): ArrayBuffer {
    const value = getPermissionFieldValue("amount", req.owner, req.spender)
    const allowance = BigInt.fromString(value)
    return String.UTF8.encode(JSON.stringify<MsgAllowanceResponse>(new MsgAllowanceResponse(allowance)))
}

export function logTransfer(from: Bech32String, to: Bech32String, amount: BigInt): void {
    const topic0str = `Transfer(address,address,uint256)`
    const topic1 = hexToUint8Array32(from);
    const topic2 = hexToUint8Array32(to);
    const topic3 = hexToUint8Array32(amount.toString(16));
    wasmxw.logWithMsgTopic(topic0str, new Uint8Array(0), [topic1, topic2, topic3]);
}

export function logApproval(owner: Bech32String, spender: Bech32String, amount: BigInt): void {
    const topic0str = `Approval(address,address,uint256)`
    const topic1 = hexToUint8Array32(owner);
    const topic2 = hexToUint8Array32(spender);
    const topic3 = hexToUint8Array32(amount.toString(16));
    wasmxw.logWithMsgTopic(topic0str, new Uint8Array(0), [topic1, topic2, topic3]);
}

