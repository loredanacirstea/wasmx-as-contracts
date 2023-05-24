import { JSON } from "json-as/assembly";
import { BigInt } from "as-bigint/assembly";
import * as wasmx from './wasmx';
import { BlockInfo, ChainInfo, AccountInfo, CurrentCallInfo, Env, TransactionInfo, CallResponse } from "./types";
import { AccountInfoJson, CallRequestJson, CallResponseJson, EnvJson } from './types_json';
import { arrayBufferTou8Array, i32ToU8Array, i32ArrayToU256, bigIntToArrayBuffer32, u8ArrayToBigInt, bigIntToU8Array32, maskBigInt256, bigIntToI32Array, u8ToI32Array } from './utils';
import { Context } from "./context";

export function getEnvWrap(): Env {
    const envJsonStr = String.UTF8.decode(wasmx.getEnv())
    console.log(envJsonStr)
    const envJson = JSON.parse<EnvJson>(envJsonStr);
    return new Env(
        new ChainInfo(
            envJson.chain.denom,
            i32ArrayToU256(envJson.chain.chainId),
            envJson.chain.chainIdFull
        ),
        new BlockInfo(
            i32ArrayToU256(envJson.block.height),
            i32ArrayToU256(envJson.block.time),
            i32ArrayToU256(envJson.block.gasLimit),
            i32ArrayToU256(envJson.block.hash),
            i32ArrayToU256(envJson.block.proposer),
        ),
        new TransactionInfo(
            BigInt.from(envJson.transaction.index),
            i32ArrayToU256(envJson.transaction.gasPrice),
        ),
        new AccountInfo(
            i32ArrayToU256(envJson.contract.address),
            i32ArrayToU256(envJson.contract.balance),
            i32ArrayToU256(envJson.contract.codeHash),
            i32ToU8Array(envJson.contract.bytecode),
        ),
        new CurrentCallInfo(
            i32ArrayToU256(envJson.currentCall.origin),
            i32ArrayToU256(envJson.currentCall.sender),
            i32ArrayToU256(envJson.currentCall.funds),
            i32ArrayToU256(envJson.currentCall.gasLimit),
            i32ToU8Array(envJson.currentCall.callData),
        ),
    )
}

export function sstore(key: BigInt, value: BigInt): void {
    wasmx.storageStore(bigIntToArrayBuffer32(key), bigIntToArrayBuffer32(value));
}

export function sload(key: BigInt): BigInt {
    const value = wasmx.storageLoad(bigIntToArrayBuffer32(key));
    return u8ArrayToBigInt(arrayBufferTou8Array(value))
}

export function blockhash(number: BigInt): BigInt {
    const value = wasmx.getBlockHash(bigIntToArrayBuffer32(number));
    return u8ArrayToBigInt(arrayBufferTou8Array(value));
}

export function getAccountInfo(address: BigInt): AccountInfo {
    const value = wasmx.getAccount(bigIntToArrayBuffer32(address));
    const valuestr = String.UTF8.decode(value)
    console.log(valuestr)
    const account = JSON.parse<AccountInfoJson>(valuestr);
    return new AccountInfo(
        i32ArrayToU256(account.address),
        i32ArrayToU256(account.balance),
        i32ArrayToU256(account.codeHash),
        i32ToU8Array(account.bytecode),
    );
}

export function setAccountInfo(account: AccountInfo): void {
    const acc = new AccountInfoJson(
        bigIntToU8Array32(account.address),
        bigIntToU8Array32(account.balance),
        bigIntToU8Array32(account.codeHash),
        account.bytecode,
    );
    const accountbz = JSON.stringify<AccountInfoJson>(acc);
    wasmx.setAccount(String.UTF8.encode(accountbz));
}

export function balance(ctx: Context, address: BigInt): BigInt {
    return ctx.env.getAccount(address).balance;
}

export function extcodesize(ctx: Context, address: BigInt): BigInt {
    return BigInt.from(ctx.env.getAccount(address).bytecode.length);
}

export function extcodehash(ctx: Context, address: BigInt): BigInt {
    return ctx.env.getAccount(address).codeHash;
}

export function getExternalCode(ctx: Context, address: BigInt): u8[] {
    return ctx.env.getAccount(address).bytecode;
}

export function call(
    ctx: Context,
    gas_limit: BigInt,
    address: BigInt,
    value: BigInt,
    calldata: u8[],
): CallResponse {
    const data = new CallRequestJson (
        bigIntToI32Array(address),
        bigIntToI32Array(ctx.env.contract.address),
        bigIntToI32Array(value),
        bigIntToI32Array(gas_limit),
        u8ToI32Array(calldata),
        u8ToI32Array(getExternalCode(ctx, address)),
        bigIntToI32Array(extcodehash(ctx, address)),
        false,
    )
    const datastr = JSON.stringify<CallRequestJson>(data);
    const valuebz = wasmx.externalCall(String.UTF8.encode(datastr));
    const response = JSON.parse<CallResponseJson>(String.UTF8.decode(valuebz));
    return new CallResponse(u8(response.success), i32ToU8Array(response.data));
}

export function callDelegate(
    ctx: Context,
    gas_limit: BigInt,
    address: BigInt,
    calldata: u8[],
): CallResponse {
    const bytecode = getExternalCode(ctx, address);
    const data = new CallRequestJson (
        bigIntToI32Array(ctx.env.contract.address),
        bigIntToI32Array(ctx.env.currentCall.sender),
        bigIntToI32Array( ctx.env.currentCall.funds),
        bigIntToI32Array(gas_limit),
        u8ToI32Array(calldata),
        u8ToI32Array(getExternalCode(ctx, address)),
        bigIntToI32Array(extcodehash(ctx, address)),
        false,
    )
    const datastr = JSON.stringify<CallRequestJson>(data);
    const valuebz = wasmx.externalCall(String.UTF8.encode(datastr));
    const response = JSON.parse<CallResponseJson>(String.UTF8.decode(valuebz));
    return new CallResponse(u8(response.success), i32ToU8Array(response.data));
}

export function callStatic(
    ctx: Context,
    gas_limit: BigInt,
    address: BigInt,
    calldata: u8[],
): CallResponse {
    const bytecode = getExternalCode(ctx, address);
    const data = new CallRequestJson (
        bigIntToI32Array(address),
        bigIntToI32Array(ctx.env.contract.address),
        bigIntToI32Array(BigInt.from(0)),
        bigIntToI32Array(gas_limit),
        u8ToI32Array(calldata),
        u8ToI32Array(getExternalCode(ctx, address)),
        bigIntToI32Array(extcodehash(ctx, address)),
        true,
    )
    const datastr = JSON.stringify<CallRequestJson>(data);
    const valuebz = wasmx.externalCall(String.UTF8.encode(datastr));
    const response = JSON.parse<CallResponseJson>(String.UTF8.decode(valuebz));
    return new CallResponse(u8(response.success), i32ToU8Array(response.data));
}

export function callCode(
    ctx: Context,
    gas_limit: BigInt,
    address: BigInt,
    value: BigInt,
    calldata: u8[],
): CallResponse {
    const bytecode = getExternalCode(ctx, address);
    const data = new CallRequestJson (
        bigIntToI32Array(ctx.env.contract.address),
        bigIntToI32Array(ctx.env.contract.address),
        bigIntToI32Array(value),
        bigIntToI32Array(gas_limit),
        u8ToI32Array(calldata),
        u8ToI32Array(getExternalCode(ctx, address)),
        bigIntToI32Array(extcodehash(ctx, address)),
        false,
    )
    const datastr = JSON.stringify<CallRequestJson>(data);
    const valuebz = wasmx.externalCall(String.UTF8.encode(datastr));
    const response = JSON.parse<CallResponseJson>(String.UTF8.decode(valuebz));
    return new CallResponse(u8(response.success), i32ToU8Array(response.data));
}

export function add(a: BigInt, b: BigInt): BigInt {
    return maskBigInt256(a.add(b));
}

export function sub(a: BigInt, b: BigInt): BigInt {
    if (a.gte(b)) return a.sub(b);
    // with underflow
    const diff = b.sub(a);
    return BigInt.from(1).mulPowTwo(256).sub(diff);
}

export function mul(a: BigInt, b: BigInt): BigInt {
    let value = a.mul(b);
    return maskBigInt256(value);
}

export function div(a: BigInt, b: BigInt): BigInt {
    return a.div(b);
}

export function sdiv(a: BigInt, b: BigInt): BigInt {
    // return a / b; // TO DO
    return BigInt.from(0);
}

export function mod(a: BigInt, b: BigInt): BigInt {
    return a.mod(b);
}

export function smod(a: BigInt, b: BigInt): BigInt {
    // return a - a / b * b; // TO DO
    return BigInt.from(0);
}

export function exp(a: BigInt, b: BigInt): BigInt {
    return maskBigInt256(a.pow(b.toInt32()));
}

export function not(a: BigInt): BigInt {
    return a.bitwiseNot();
}

export function lt(a: BigInt, b: BigInt): BigInt {
    return BigInt.from(a.lt(b) ? 1 : 0);
}

export function gt(a: BigInt, b: BigInt): BigInt {
    return BigInt.from(a.gt(b) ? 1 : 0);
}

export function slt(a: BigInt, b: BigInt): BigInt {
    // if (a == a.neg()) {
    //     return BigInt.from(a > b ? 1 : 0);
    // } else {
    //     return BigInt.from(a < b ? 1 : 0);
    // }
    // TO DO ?
    return BigInt.from(0)
}

export function sgt(a: BigInt, b: BigInt): BigInt {
    // if (a == a.neg()) {
    //     return BigInt.from(a < b ? 1 : 0);
    // } else {
    //     return BigInt.from(a > b ? 1 : 0);
    // }
    // TO DO ?
    return BigInt.from(0)
}

export function eq(a: BigInt, b: BigInt): BigInt {
    return BigInt.from(a.eq(b) ? 1 : 0);
}

export function iszero(a: BigInt): BigInt {
    return BigInt.from(a.isZero() ? 1 : 0);
}

export function and(a: BigInt, b: BigInt): BigInt {
    return a.bitwiseAnd(b);
}

export function or(a: BigInt, b: BigInt): BigInt {
    return a.bitwiseOr(b);
}

export function xor(a: BigInt, b: BigInt): BigInt {
    return a.bitwiseXor(b);
}

export function byte(a: BigInt, b: BigInt): BigInt {
    const arr: u8[] = bigIntToU8Array32(b);
    const ind = a.toInt32();
    return u8ArrayToBigInt(arr.slice(ind, ind + 1));
}

export function shl(shift: BigInt, value: BigInt): BigInt {
    const v = shift.toInt32()
    if (v > 255) return BigInt.from(0)
    return value.leftShift(v);
}

export function shr(shift: BigInt, value: BigInt): BigInt {
    const v = shift.toInt32()
    if (v > 255) return BigInt.from(0)
    return value.rightShift(v);
}

// nobits, value
export function sar(a: BigInt, b: BigInt): BigInt {
    // if (a == a.neg()) {
    //     return (b >> a.pos()).neg();
    // } else {
    //     return b >> a;
    // }
    return BigInt.from(0);
    // TO DO ?
//    const _nobits = nobits.toNumber();
//     let valueBase2;
//     if (value.isNeg()) {
//         valueBase2 = value.toTwos(256).toString(2);
//     } else {
//         valueBase2 = value.toString(2).padStart(256, '0');
//     }
//     // remove LSB * _nobits
//     valueBase2 = valueBase2.substring(0, valueBase2.length - _nobits);
//     // add MSB * _nobits
//     valueBase2 = valueBase2[0].repeat(_nobits) + valueBase2;
//     const result = (new BN(valueBase2, 2)).fromTwos(256);
}

export function addmod(a: BigInt, b: BigInt, c: BigInt): BigInt {
    return a.add(b).mod(c);
}

export function mulmod(a: BigInt, b: BigInt, c: BigInt): BigInt {
    return a.mul(b).mod(c);
}

// size, value
export function signextend(a: BigInt, b: BigInt): BigInt {
    // return a < b; // TO DO
    return BigInt.from(0);
}

// 48
// storage - empty bytes default
//
