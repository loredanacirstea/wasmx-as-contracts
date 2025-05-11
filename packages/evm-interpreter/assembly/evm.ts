import { JSON } from "json-as";
import { BigInt } from "./bn";
import * as wasmx from './wasmx';
import {
    BlockInfo, ChainInfo, AccountInfo,
    CurrentCallInfo, Env,
    TransactionInfo, CallResponse,
    CallRequest,
    Create2AccountRequest, CreateAccountRequest,
    EvmLog,
} from "./types";
import { arrayBufferTou8Array, i32ToU8Array, i32ArrayToU256, u8ArrayToBigInt, u8ToI32Array, bigIntToI32Array32, bigIntToU8Array32, maxUint } from './utils';
import { Context } from './context';

export function getEnvWrap(): Env {
    const envJsonStr = String.UTF8.decode(wasmx.getEnv())
    // console.log(envJsonStr)
    const env = JSON.parse<Env>(envJsonStr);
    // the JSON decoder does not call the constructor
    env.init();
    env.block.difficulty = BigInt.empty();
    return env;
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
    const account = JSON.parse<AccountInfo>(valuestr);
    return new AccountInfo(
        account.address,
        account.codeHash,
        account.bytecode,
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
    calldata: Uint8Array,
): CallResponse {
    const data = new CallRequest(
        address,
        ctx.env.contract.address,
        value,
        gas_limit,
        calldata,
        getExternalCode(ctx, address),
        extcodehash(ctx, address),
        false,
    )
    const datastr = JSON.stringify<CallRequest>(data);
    const valuebz = wasmx.externalCall(String.UTF8.encode(datastr));
    const response = JSON.parse<CallResponse>(String.UTF8.decode(valuebz));
    return new CallResponse(response.success, response.data);
}

export function callDelegate(
    ctx: Context,
    gas_limit: BigInt,
    address: BigInt,
    calldata: Uint8Array,
): CallResponse {
    const data = new CallRequest(
        ctx.env.contract.address,
        ctx.env.currentCall.sender,
        ctx.env.currentCall.funds,
        gas_limit,
        calldata,
        getExternalCode(ctx, address),
        extcodehash(ctx, address),
        false,
    )
    const datastr = JSON.stringify<CallRequest>(data);
    const valuebz = wasmx.externalCall(String.UTF8.encode(datastr));
    const response = JSON.parse<CallResponse>(String.UTF8.decode(valuebz));
    return new CallResponse(response.success, response.data);
}

export function callStatic(
    ctx: Context,
    gas_limit: BigInt,
    address: BigInt,
    calldata: Uint8Array,
): CallResponse {
    const data = new CallRequest(
        address,
        ctx.env.contract.address,
        BigInt.fromU32(0),
        gas_limit,
        calldata,
        getExternalCode(ctx, address),
        extcodehash(ctx, address),
        true,
    )
    const datastr = JSON.stringify<CallRequest>(data);
    const valuebz = wasmx.externalCall(String.UTF8.encode(datastr));
    const response = JSON.parse<CallResponse>(String.UTF8.decode(valuebz));
    return new CallResponse(response.success, response.data);
}

export function callCode(
    ctx: Context,
    gas_limit: BigInt,
    address: BigInt,
    value: BigInt,
    calldata: Uint8Array,
): CallResponse {
    const data = new CallRequest(
        ctx.env.contract.address,
        ctx.env.contract.address,
        value,
        gas_limit,
        calldata,
        getExternalCode(ctx, address),
        extcodehash(ctx, address),
        false,
    )
    const datastr = JSON.stringify<CallRequest>(data);
    const valuebz = wasmx.externalCall(String.UTF8.encode(datastr));
    const response = JSON.parse<CallResponse>(String.UTF8.decode(valuebz));
    return new CallResponse(response.success, response.data);
}

export function create(
    value: BigInt,
    bytecode: Uint8Array,
): BigInt {
    const data = new CreateAccountRequest(bytecode, value)
    const datastr = JSON.stringify<CreateAccountRequest>(data);
    const addressbz = wasmx.createAccountInterpreted(String.UTF8.encode(datastr));
    return new BigInt(addressbz, false);
}

export function create2(
    value: BigInt,
    bytecode: Uint8Array,
    salt: BigInt,
): BigInt {
    const data = new Create2AccountRequest (bytecode, value, salt)
    const datastr = JSON.stringify<Create2AccountRequest>(data);
    const addressbz = wasmx.create2AccountInterpreted(String.UTF8.encode(datastr));
    return new BigInt(addressbz, false);
}

export function log_evm(
    data: Uint8Array,
    topics: Array<Uint8Array>,
): void {
    const logs = new EvmLog(data, topics)
    const logstr = JSON.stringify<EvmLog>(logs);
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
