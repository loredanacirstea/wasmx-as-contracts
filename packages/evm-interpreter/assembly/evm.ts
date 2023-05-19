import { JSON } from "json-as/assembly";
import { BigInt } from "as-bigint/assembly";
import * as wasmx from './wasmx';
import { BlockInfo, ChainInfo, ContractInfo, CurrentCallInfo, Env, TransactionInfo } from "./types";
import { EnvJson } from './types_json';
import { arrayBufferTou8Array, i32Toi8Array, i32ArrayToU256, bigIntToArrayBuffer, u8ArrayToBigInt, bigIntToU8Array32, maskBigInt256 } from './utils';

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
        new ContractInfo(
            i32ArrayToU256(envJson.contract.address),
            i32Toi8Array(envJson.contract.bytecode),
            i32ArrayToU256(envJson.contract.balance),
        ),
        new CurrentCallInfo(
            i32ArrayToU256(envJson.currentCall.origin),
            i32ArrayToU256(envJson.currentCall.sender),
            i32ArrayToU256(envJson.currentCall.funds),
            i32ArrayToU256(envJson.currentCall.gasLimit),
            envJson.currentCall.isQuery,
            i32Toi8Array(envJson.currentCall.callData),
        ),
    )
}

export function sstore(key: BigInt, value: BigInt): void {
    wasmx.storageStore(bigIntToArrayBuffer(key), bigIntToArrayBuffer(value));
}

export function sload(key: BigInt): BigInt {
    const value = wasmx.storageLoad(bigIntToArrayBuffer(key));
    return u8ArrayToBigInt(arrayBufferTou8Array(value))
}

export function balance(address: BigInt): BigInt {
    const value = wasmx.getExternalBalance(bigIntToArrayBuffer(address));
    return u8ArrayToBigInt(arrayBufferTou8Array(value));
}

export function extcodesize(address: BigInt): BigInt {
    const value = wasmx.getExternalCodeSize(bigIntToArrayBuffer(address));
    return u8ArrayToBigInt(arrayBufferTou8Array(value));
}

export function extcodehash(address: BigInt): BigInt {
    const value = wasmx.getExternalCodeHash(bigIntToArrayBuffer(address));
    return u8ArrayToBigInt(arrayBufferTou8Array(value));
}

export function blockhash(number: BigInt): BigInt {
    const value = wasmx.getBlockHash(bigIntToArrayBuffer(number));
    return u8ArrayToBigInt(arrayBufferTou8Array(value));
}

export function getExternalCode(address: BigInt): u8[] {
    const value = wasmx.getExternalCode(bigIntToArrayBuffer(address));
    return arrayBufferTou8Array(value);
}

export function add(a: BigInt, b: BigInt): BigInt {
    return a.add(b);
}

export function sub(a: BigInt, b: BigInt): BigInt {
    return a.sub(b);
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
    // return a - a / b * b;
    return BigInt.from(0);
}

export function smod(a: BigInt, b: BigInt): BigInt {
    // return a - a / b * b; // TO DO
    return BigInt.from(0);
}

export function exp(a: BigInt, b: BigInt): BigInt {
    // if (b.lt(toBN(0))) return toBN(0);
    // return a ** b; // TO DO
    return BigInt.from(0);
}

export function not(a: BigInt): BigInt {
    return a.bitwiseNot();
}

export function lt(a: BigInt, b: BigInt): BigInt {
    return BigInt.from(a < b ? 1 : 0);
}

export function gt(a: BigInt, b: BigInt): BigInt {
    return BigInt.from(a > b ? 1 : 0);
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
    return BigInt.from(a == b ? 1 : 0);
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
    if (shift.toInt32() > 255) return BigInt.from(0)
    return value.leftShift(shift.toInt32());
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
    return mod(a.add(b), c); // TO DO ?
}

export function mulmod(a: BigInt, b: BigInt, c: BigInt): BigInt {
    // return mod(a * b, c); // TO DO ?
    return BigInt.from(0);
}

// size, value
export function signextend(a: BigInt, b: BigInt): BigInt {
    // return a < b; // TO DO
    return BigInt.from(0);
}

// 48
// storage - empty bytes default
//
