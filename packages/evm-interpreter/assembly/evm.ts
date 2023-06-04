import { JSON } from "json-as/assembly";
import { BigInt } from "./bn";
import * as wasmx from './wasmx';
import { BlockInfo, ChainInfo, AccountInfo, CurrentCallInfo, Env, TransactionInfo, CallResponse } from "./types";
import { AccountInfoJson, CallRequestJson, CallResponseJson, Create2AccountRequestJson, CreateAccountRequestJson, EnvJson, EvmLogJson } from './types_json';
import { arrayBufferTou8Array, i32ToU8Array, i32ArrayToU256, u8ArrayToBigInt, bigIntToU8Array32, u8ToI32Array, bigIntToI32Array32, maxUint } from './utils';
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
            BigInt.fromU32(envJson.transaction.index),
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
    wasmx.storageStore(key.toArrayBufferBe(), value.toArrayBufferBe());
}

export function sload(key: BigInt): BigInt {
    const value = wasmx.storageLoad(key.toArrayBufferBe());
    return new BigInt(value, false);
}

export function blockhash(number: BigInt): BigInt {
    const value = wasmx.getBlockHash(number.toArrayBufferBe());
    return new BigInt(value, false);
}

export function getAccountInfo(address: BigInt): AccountInfo {
    const value = wasmx.getAccount(address.toArrayBufferBe());
    const valuestr = String.UTF8.decode(value)
    const account = JSON.parse<AccountInfoJson>(valuestr);
    return new AccountInfo(
        i32ArrayToU256(account.address),
        i32ArrayToU256(account.codeHash),
        i32ToU8Array(account.bytecode),
    );
}

export function balance(address: BigInt): BigInt {
    const balance = wasmx.getBalance(address.toArrayBufferBe());
    return new BigInt(balance, false);
}

export function extcodesize(ctx: Context, address: BigInt): BigInt {
    return BigInt.fromU32(ctx.env.getAccount(address).bytecode.length);
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
    const data = new CallRequestJson (
        bigIntToI32Array32(address),
        bigIntToI32Array32(ctx.env.contract.address),
        bigIntToI32Array32(BigInt.fromU32(0)),
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
    return new BigInt(addressbz, false);
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
    return new BigInt(addressbz, false);
}

export function log_evm(
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
    return a.add(b).mask(32);
}

export function sub(a: BigInt, b: BigInt): BigInt {
    if (a.gte(b)) return a.sub(b);
    // with underflow
    const diff = b.sub(a);
    return maxUint().sub(diff);
}

export function mul(a: BigInt, b: BigInt): BigInt {
    let value = a.mul(b);
    return value.mask(32);
}

export function div(a: BigInt, b: BigInt): BigInt {
    if (a.isZero() || b.isZero()) return BigInt.fromU32(0);
    return a.div(b);
}

export function sdiv(a: BigInt, b: BigInt): BigInt {
    if (a.isZero() || b.isZero()) return BigInt.fromU32(0);
    return a.sdiv(b);
}

export function mod(a: BigInt, b: BigInt): BigInt {
    if (a.isZero() || b.isZero()) return BigInt.fromU32(0);
    return a.mod(b);
}

export function smod(a: BigInt, b: BigInt): BigInt {
    if (a.isZero() || b.isZero()) return BigInt.fromU32(0);
    return a.smod(b);
}

export function exp(a: BigInt, b: BigInt): BigInt {
    return a.pow(b).mask(32);
}

export function not(a: BigInt): BigInt {
    return BigInt.not(a);
}

export function lt(a: BigInt, b: BigInt): BigInt {
    return a.lt_t(b);
}

export function gt(a: BigInt, b: BigInt): BigInt {
    return a.gt_t(b);
}

export function slt(a: BigInt, b: BigInt): BigInt {
    return a.slt_t(b);
}

export function sgt(a: BigInt, b: BigInt): BigInt {
    return a.sgt_t(b);
}

export function eq(a: BigInt, b: BigInt): BigInt {
    return a.eq_t(b);
}

export function iszero(a: BigInt): BigInt {
    return a.isZero_t();
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
    if (shift.isZero()) return value;
    const v = shift.toU32()
    if (v > 255) return BigInt.fromU32(0)
    return value.shl(v).mask(32);
}

export function shr(shift: BigInt, value: BigInt): BigInt {
    if (shift.isZero()) return value;
    const v = shift.toU32()
    if (v > 255) return BigInt.fromU32(0)
    return value.shr(v);
}

export function addmod(a: BigInt, b: BigInt, c: BigInt): BigInt {
    const value = BigInt.addmod(a, b, c);
    return value.mask(32);
}

export function mulmod(a: BigInt, b: BigInt, c: BigInt): BigInt {
    const value = BigInt.mulmod(a, b, c);
    return value.mask(32);
}

// nobits, value
export function sar(bitsno: BigInt, value: BigInt): BigInt {
    if (value.isZero()) return BigInt.fromU32(0);
    return value.sar(bitsno, 256);
}

// sign extend from (i*8+7)th bit counting from least significant
export function signextend(i: BigInt, x: BigInt): BigInt {
    const b = i.toU32();
    if (b >= 31) return x;
    const bits: u32 = b*8+8;
    const extbits: u32 = u32(256) - bits;

    let v = x.shl(extbits)
    v = v.mask(32);
    const isneg = v.isNeg();
    v = v.shr(extbits);

    if (!isneg) return v;
    const padd = BigInt.fromU32(2).pown(256).sub(BigInt.fromU32(1)).shr(bits).shl(bits);
    v = padd.add(v);
    return v;
}

export function keccak256(data: u8[]): BigInt {
    const _data = new Uint8Array(data.length);
    _data.set(data);
    const hash = wasmx.keccak256(_data.buffer);
    return new BigInt(hash, false);
}

// export function keccak256(ctx: Context, data: u8[]): BigInt {
//     // const _data = new Uint8Array(data.length);
//     // _data.set(data);
//     // const hash = wasmx.keccak256(_data.buffer);
//     // return u8ArrayToBigInt(arrayBufferTou8Array(hash));
//     return BigInt.fromU32(0);
// }

// export function keccak256(ctx: Context, data: u8[]): BigInt {
//     const hash: ArrayBuffer = new ArrayBuffer(32);
//     const inputOffset = changetype<i32>(data);
//     const outputOffset = changetype<i32>(hash);
//     ctx.resetKeccakSpace();
//     wasmx.keccak256(i32(ctx.keccakOffset), inputOffset, data.length, outputOffset);
//    return new BigInt(hash, false);
// }
