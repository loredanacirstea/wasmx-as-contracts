import { JSON } from "json-as/assembly";
import * as wasmx from './wasmx';
import { BlockInfo, ChainInfo, ContractInfo, CurrentCallInfo, Env, TransactionInfo } from "./types";
import { EnvJson } from './types_json';
import { u256 } from "as-bignum/assembly";
import { arrayBufferTou8Array, i32Toi8Array, i32ArrayToU256 } from './utils';

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
            new u256(envJson.transaction.index),
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

export function sstore(key: u256, value: u256): void {
    wasmx.storageStore(key.toUint8Array(true).buffer, value.toUint8Array(true).buffer);
}

export function sload(key: u256): u256 {
    const value = wasmx.storageLoad(key.toUint8Array(true).buffer);
    return u256.fromBytesBE(arrayBufferTou8Array(value))
}

export function balance(address: u256): u256 {
    const value = wasmx.getExternalBalance(address.toUint8Array(true).buffer);
    return u256.fromBytesBE(arrayBufferTou8Array(value));
}

export function extcodesize(address: u256): u256 {
    const value = wasmx.getExternalCodeSize(address.toUint8Array(true).buffer);
    return u256.fromBytesBE(arrayBufferTou8Array(value));
}

export function extcodehash(address: u256): u256 {
    const value = wasmx.getExternalCodeHash(address.toUint8Array(true).buffer);
    return u256.fromBytesBE(arrayBufferTou8Array(value));
}

export function blockhash(number: u256): u256 {
    const value = wasmx.getBlockHash(number.toUint8Array(true).buffer);
    return u256.fromBytesBE(arrayBufferTou8Array(value));
}

export function getExternalCode(address: u256): u8[] {
    const value = wasmx.getExternalCode(address.toUint8Array(true).buffer);
    return arrayBufferTou8Array(value);
}

export function add(a: u256, b: u256): u256 {
    return u256.add(a, b);
}

export function sub(a: u256, b: u256): u256 {
    return u256.sub(a, b);
}

export function mul(a: u256, b: u256): u256 {
    return u256.mul(a, b);
}

export function div(a: u256, b: u256): u256 {
    // return a / b;
    return new u256(0);
}

export function sdiv(a: u256, b: u256): u256 {
    // return a / b; // TO DO
    return new u256(0);
}

export function mod(a: u256, b: u256): u256 {
    // return a - a / b * b;
    return new u256(0);
}

export function smod(a: u256, b: u256): u256 {
    // return a - a / b * b; // TO DO
    return new u256(0);
}

export function exp(a: u256, b: u256): u256 {
    // if (b.lt(toBN(0))) return toBN(0);
    // return a ** b; // TO DO
    return new u256(0);
}

export function not(a: u256): u256 {
    // a.notn(256);
    return a.not();
}

export function lt(a: u256, b: u256): u256 {
    return new u256(a < b ? 1 : 0);
}

export function gt(a: u256, b: u256): u256 {
    return new u256(a > b ? 1 : 0);
}

export function slt(a: u256, b: u256): u256 {
    if (a == a.neg()) {
        return new u256(a > b ? 1 : 0);
    } else {
        return new u256(a < b ? 1 : 0);
    }
    // TO DO ?
}

export function sgt(a: u256, b: u256): u256 {
    if (a == a.neg()) {
        return new u256(a < b ? 1 : 0);
    } else {
        return new u256(a > b ? 1 : 0);
    }
    // TO DO ?
}

export function eq(a: u256, b: u256): u256 {
    return new u256(a == b ? 1 : 0);
}

export function iszero(a: u256): u256 {
    return new u256(a.isZero() ? 1 : 0);
}

export function and(a: u256, b: u256): u256 {
    return u256.and(a, b);
}

export function or(a: u256, b: u256): u256 {
    return u256.or(a, b);
}

export function xor(a: u256, b: u256): u256 {
    return u256.xor(a, b);
}

export function byte(a: u256, b: u256): u256 {
    const arr: Uint8Array = b.toUint8Array();
    return u256.fromBytes(arr.slice(i32(a.lo1 & 0xffffffff), i32(1)));
    // TO DO ?  a.lo1 & 0xffffffff
}

export function shl(shift: u256, value: u256): u256 {
    if (shift.toI32() > 255) return u256.Zero
    return u256.shl(value, shift.toI32());
}

export function shr(shift: u256, value: u256): u256 {
    if (shift.toI32() > 255) return u256.Zero
    return u256.shr(value, shift.toI32());
}

// nobits, value
export function sar(a: u256, b: u256): u256 {
    // if (a == a.neg()) {
    //     return (b >> a.pos()).neg();
    // } else {
    //     return b >> a;
    // }
    return new u256(0);
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

export function addmod(a: u256, b: u256, c: u256): u256 {
    return mod(u256.add(a, b), c); // TO DO ?
}

export function mulmod(a: u256, b: u256, c: u256): u256 {
    // return mod(a * b, c); // TO DO ?
    return new u256(0);
}

// size, value
export function signextend(a: u256, b: u256): u256 {
    // return a < b; // TO DO
    return new u256(0);
}

// 48
// storage - empty bytes default
//
