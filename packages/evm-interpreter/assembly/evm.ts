import { JSON } from "json-as/assembly";
import { BigInt } from "as-bigint/assembly";
import * as wasmx from './wasmx';
import { BlockInfo, ChainInfo, AccountInfo, CurrentCallInfo, Env, TransactionInfo, CallResponse } from "./types";
import { AccountInfoJson, CallRequestJson, CallResponseJson, Create2AccountRequestJson, CreateAccountRequestJson, EnvJson, EvmLogJson } from './types_json';
import { arrayBufferTou8Array, i32ToU8Array, i32ArrayToU256, bigIntToArrayBuffer32, u8ArrayToBigInt, bigIntToU8Array32, maskBigInt256, bigIntToI32Array, u8ToI32Array, arrayBufferToBigInt, bigIntToI32Array32 } from './utils';
import { Context } from './context';

export function getEnvWrap(): Env {
    const envJsonStr = String.UTF8.decode(wasmx.getEnv())
    // console.log(envJsonStr)
    const envJson = JSON.parse<EnvJson>(envJsonStr);
    return new Env(
        new ChainInfo(
            envJson.chain.denom,
            i32ArrayToU256(envJson.chain.chainId),
            envJson.chain.chainIdFull
        ),
        new BlockInfo(
            i32ArrayToU256(envJson.block.height),
            i32ArrayToU256(envJson.block.timestamp),
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
    const account = JSON.parse<AccountInfoJson>(valuestr);
    return new AccountInfo(
        i32ArrayToU256(account.address),
        i32ArrayToU256(account.codeHash),
        i32ToU8Array(account.bytecode),
    );
}

export function balance(address: BigInt): BigInt {
    const balance = wasmx.getBalance(bigIntToArrayBuffer32(address));
    return arrayBufferToBigInt(balance);
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
        bigIntToI32Array32(address),
        bigIntToI32Array32(ctx.env.contract.address),
        bigIntToI32Array32(value),
        bigIntToI32Array32(gas_limit),
        u8ToI32Array(calldata),
        u8ToI32Array(getExternalCode(ctx, address)),
        bigIntToI32Array32(extcodehash(ctx, address)),
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
        bigIntToI32Array32(ctx.env.contract.address),
        bigIntToI32Array32(ctx.env.currentCall.sender),
        bigIntToI32Array32( ctx.env.currentCall.funds),
        bigIntToI32Array32(gas_limit),
        u8ToI32Array(calldata),
        u8ToI32Array(getExternalCode(ctx, address)),
        bigIntToI32Array32(extcodehash(ctx, address)),
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
        bigIntToI32Array32(address),
        bigIntToI32Array32(ctx.env.contract.address),
        bigIntToI32Array32(BigInt.from(0)),
        bigIntToI32Array32(gas_limit),
        u8ToI32Array(calldata),
        u8ToI32Array(getExternalCode(ctx, address)),
        bigIntToI32Array32(extcodehash(ctx, address)),
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
        bigIntToI32Array32(ctx.env.contract.address),
        bigIntToI32Array32(ctx.env.contract.address),
        bigIntToI32Array32(value),
        bigIntToI32Array32(gas_limit),
        u8ToI32Array(calldata),
        u8ToI32Array(getExternalCode(ctx, address)),
        bigIntToI32Array32(extcodehash(ctx, address)),
        false,
    )
    const datastr = JSON.stringify<CallRequestJson>(data);
    const valuebz = wasmx.externalCall(String.UTF8.encode(datastr));
    const response = JSON.parse<CallResponseJson>(String.UTF8.decode(valuebz));
    return new CallResponse(u8(response.success), i32ToU8Array(response.data));
}

export function create(
    value: BigInt,
    bytecode: u8[],
): BigInt {
    const data = new CreateAccountRequestJson (
        u8ToI32Array(bytecode),
        bigIntToI32Array32(value),
    )
    const datastr = JSON.stringify<CreateAccountRequestJson>(data);
    const addressbz = wasmx.createAccount(String.UTF8.encode(datastr));
    return arrayBufferToBigInt(addressbz);
}

export function create2(
    value: BigInt,
    bytecode: u8[],
    salt: BigInt,
): BigInt {
    const data = new Create2AccountRequestJson (
        u8ToI32Array(bytecode),
        bigIntToI32Array32(value),
        bigIntToI32Array32(salt),
    )
    const datastr = JSON.stringify<Create2AccountRequestJson>(data);
    const addressbz = wasmx.create2Account(String.UTF8.encode(datastr));
    return arrayBufferToBigInt(addressbz);
}

export function log(
    data: u8[],
    topics: BigInt[],
): void {
    const _topics: i32[][] = topics.map((v: BigInt): i32[] => {
        return bigIntToI32Array32(v);
    });
    const logs = new EvmLogJson (
        u8ToI32Array(data),
        _topics,
    )
    const logstr = JSON.stringify<EvmLogJson>(logs);
    wasmx.log(String.UTF8.encode(logstr));
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
    return twosComplement(a).div(twosComplement(b));
}

export function mod(a: BigInt, b: BigInt): BigInt {
    return a.mod(b);
}

export function smod(a: BigInt, b: BigInt): BigInt {
    return twosComplement(a).mod(twosComplement(b));
}

export function exp(a: BigInt, b: BigInt): BigInt {
    return maskBigInt256(a.pow(b.toInt32()));
}

export function not(a: BigInt): BigInt {
    const base2 = a.toString(2);
    let result = '';
    for (let i = 0; i < base2.length; i++) {
        result += (base2.substr(i, 1) === '0') ? '1' : '0';
    }
    result = result.padStart(256, '1');
    return BigInt.fromString(result, 2);
}

export function lt(a: BigInt, b: BigInt): BigInt {
    return BigInt.from(a.lt(b) ? 1 : 0);
}

export function gt(a: BigInt, b: BigInt): BigInt {
    return BigInt.from(a.gt(b) ? 1 : 0);
}

export function slt(a: BigInt, b: BigInt): BigInt {
    return BigInt.from(twosComplement(a).lt(twosComplement(b)) ? 1 : 0);
}

export function sgt(a: BigInt, b: BigInt): BigInt {
    return BigInt.from(twosComplement(a).gt(twosComplement(b)) ? 1 : 0);
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

export function addmod(a: BigInt, b: BigInt, c: BigInt): BigInt {
    return a.add(b).mod(c);
}

export function mulmod(a: BigInt, b: BigInt, c: BigInt): BigInt {
    return a.mul(b).mod(c);
}

// nobits, value
export function sar(bitsno: BigInt, value: BigInt): BigInt {
    const msb = isNeg(value) ? 1 : 0;
    const _bitsno = bitsno.toInt32();
    let v = value.rightShift(_bitsno);
    if (msb == 0) return v;
    for (let i = 0; i < _bitsno; i++) {
        v = v.add(BigInt.from(2).pow(255 - i));
    }
    return v;
}

// sign extend from (i*8+7)th bit counting from least significant
export function signextend(i: BigInt, x: BigInt): BigInt {
    const b = i.toInt32();
    if (b >= 31) return x;
    const bits = b*8+8;
    const extbits = 256 - bits;

    let v = x.leftShift(extbits)
    v = maskBigInt256(v);
    v = v.rightShift(extbits);

    if (!isNeg(v, bits-1)) return v;
    const padd = BigInt.from(2).pow(256).sub(1).rightShift(bits).leftShift(bits);
    v = padd.add(v);
    return v;
}

export function keccak256(data: u8[]): BigInt {
    const _data = new Uint8Array(data.length);
    _data.set(data);
    const hash = wasmx.keccak256(_data.buffer);
    return u8ArrayToBigInt(arrayBufferTou8Array(hash));
}

function isNeg(a: BigInt, size: i32 = 255): bool {
    const sign = a.rightShift(size);
    if (sign.toInt32() === 1) return true;
    return false;
}

function twosComplement(a: BigInt): BigInt {
    if (!isNeg(a)) return a;
    const abs = BigInt.from(2).pow(256).sub(a);
    return abs.opposite();
}
