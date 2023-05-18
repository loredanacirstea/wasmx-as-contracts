import { u256 } from 'as-bignum/assembly';

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
    console.log(buffer.toString())
    const length = buffer.byteLength;
    const uint8View = Uint8Array.wrap(buffer);
    const u8Array: u8[] = [];

    for (let i = 0; i < length; i++) {
        u8Array[i] =  uint8View[i];
    }
    return u8Array;
}

export function i32Toi8Array(arr: i32[]): u8[] {
    return arr.map((v: i32) => u8(v));
}

export function i32ArrayToBytes32(arr: i32[]): u8[] {
    let addr = i32Toi8Array(arr);
    if (addr.length < 32) {
        addr = new Array<u8>(32 - addr.length).concat(addr);
    }
    return addr;
}

export function i32ArrayToU256(arr: i32[]): u256 {
    return u256.fromBytesBE(i32ArrayToBytes32(arr));
}
