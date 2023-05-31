import { BigInt } from "./bn";

export function maxUint(): BigInt {
    return BigInt.fromU32(2).pown(256);
}

export function u8ArrayToArrayBuffer(u8Array: u8[]): ArrayBuffer {
    const length = u8Array.length;
    const buffer = new ArrayBuffer(length);
    const uint8View = Uint8Array.wrap(buffer);

    for (let i = 0; i < length; i++) {
      uint8View[i] = u8Array[i];
    }
    return buffer;
}

export function arrayBufferTou8Array(buffer: ArrayBuffer): u8[] {
    const length = buffer.byteLength;
    const uint8View = Uint8Array.wrap(buffer);
    const u8Array: u8[] = [];

    for (let i = 0; i < length; i++) {
        u8Array[i] =  uint8View[i];
    }
    return u8Array;
}

export function i32ToU8Array(arr: i32[]): u8[] {
    return arr.map((v: i32) => u8(v));
}

export function u8ToI32Array(arr: u8[]): i32[] {
    return arr.map((v: u8) => i32(v));
}

export function i32ArrayToBytes32(arr: i32[]): u8[] {
    let addr = i32ToU8Array(arr);
    if (addr.length < 32) {
        addr = new Array<u8>(32 - addr.length).concat(addr);
    }
    return addr;
}

export function u8ArrayToHex(arr: u8[]): string {
    return arr.reduce((accum: string, v: u8) => accum + v.toString(16).padStart(2, '0'), "");
}

export function hexToU8(value: string): u8[] {
    const arr: u8[] = [];
    if (value.length % 2 == 1) value = "0" + value;
    value = value.padStart(64, '0');

    for (let i = 0; i < value.length / 2; i++) {
        arr[i] = u8(parseInt(value.substr(2*i, 2), 16))
    }
    return arr;
}

export function bigIntToU8Array32(v: BigInt): u8[] {
    let arr = v.toU8ArrayBe();
    if (arr.length < 33) {
        return new Array<u8>(32 - arr.length).concat(arr);
    }
    return arr.slice(arr.length - 32);
}

export function bigIntToI32Array32(v: BigInt): i32[] {
    let arr = v.toI32ArrayBe();
    if (arr.length < 33) {
        return new Array<i32>(32 - arr.length).concat(arr);
    }
    return arr.slice(arr.length - 32);
}

export function u8ArrayToBigInt(arr: u8[]): BigInt {
    return BigInt.fromU8Array(arr, arr.length, false);
}

export function i32ArrayToU256(arr: i32[]): BigInt {
    return u8ArrayToBigInt(i32ArrayToBytes32(arr));
}
