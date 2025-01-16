import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import { Base64String, HexString } from "./types";

export function arrayBufferToU8Array(buffer: ArrayBuffer): u8[] {
    const length = buffer.byteLength;
    const uint8View = Uint8Array.wrap(buffer);
    const u8Array: u8[] = [];

    for (let i = 0; i < length; i++) {
        u8Array[i] =  uint8View[i];
    }
    return u8Array;
}

export function uint8ArrayToHex(arr: Uint8Array): string {
    return arr.reduce((accum: string, v: u8) => accum + v.toString(16).padStart(2, '0'), "");
}

export function strip0x(val: string): string {
    if (val.substring(0, 2) == "0x") {
        val = val.substring(2)
    }
    return val
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

export function hexToUint8Array32(value: string): Uint8Array {
    value = value.padStart(64, '0');
    return hexToUint8Array(value);
}

export function hexToUint8Array(value: string): Uint8Array {
    if (value.length % 2 == 1) value = "0" + value;
    const arr: Uint8Array = new Uint8Array(value.length / 2);
    for (let i = 0; i < value.length / 2; i++) {
        const item = u8(parseInt(value.substr(2*i, 2), 16));
        arr.set([item], i);
    }
    return arr;
}

export function parseUint8ArrayToI32BigEndian(buff: Uint8Array): i32 {
    var view = new DataView(buff.buffer, 0);
    return view.getInt32(0, false);
}

export function parseUint8ArrayToU32BigEndian(buff: Uint8Array): u32 {
    var view = new DataView(buff.buffer, 0);
    return view.getUint32(0, false);
}

export function parseUint8ArrayToI64BigEndian(buff: Uint8Array): i64 {
    var view = new DataView(buff.buffer, 0);
    return view.getInt64(0, false);
}

export function parseUint8ArrayToU64BigEndian(buff: Uint8Array): u64 {
    var view = new DataView(buff.buffer, 0);
    return view.getUint64(0, false);
}

export function u64FromBuffer(buff: ArrayBuffer, littleEndian: bool = false): u64 {
    var view = new DataView(buff, 0);
    return view.getUint64(0, littleEndian);
}

export function i32ToUint8ArrayBE(value: i32): Uint8Array {
    const v = new ArrayBuffer(4);
    var view = new DataView(v, 0);
    view.setInt32(0, value, false);
    return Uint8Array.wrap(v);
}

export function i64ToUint8ArrayBE(value: i64): Uint8Array {
    const v = new ArrayBuffer(8);
    var view = new DataView(v, 0);
    view.setInt64(0, value, false);
    return Uint8Array.wrap(v);
}

export function u64ToUint8ArrayBE(value: u64): Uint8Array {
    const v = new ArrayBuffer(8);
    var view = new DataView(v, 0);
    view.setUint64(0, value, false);
    return Uint8Array.wrap(v);
}

export function parseInt32(value: string): i32 {
    return i32(parseInt(value));
}

export function parseInt64(value: string): i64 {
    return i64(parseInt(value));
}

export function getAddressHex(addrbuf: ArrayBuffer): string {
    return uint8ArrayToHex(Uint8Array.wrap(addrbuf));
}

export function base64ToHex(value: Base64String): HexString {
    return uint8ArrayToHex(decodeBase64(value))
}

export function hex64ToBase64(value: HexString): Base64String {
    return encodeBase64(hexToUint8Array32(value))
}

export function base64ToString(value: Base64String): string {
    return String.UTF8.decode(decodeBase64(value).buffer)
}

export function stringToBase64(value: string): Base64String {
    return encodeBase64(Uint8Array.wrap(String.UTF8.encode(value)))
}

export function bytes(u8arr: u8[]): Uint8Array {
    const v = new Uint8Array(u8arr.length);
    for (let i = 0; i < u8arr.length; i++) {
        v[i] = u8arr[i];
    }
    return v;
}

export function concatBytes(arr1: Uint8Array, arr2: Uint8Array): Uint8Array {
    let combined = new Uint8Array(arr1.length + arr2.length);
    combined.set(arr1, 0);
    combined.set(arr2, arr1.length);
    return combined;
}

export function stringToBytes(v: string): Uint8Array {
    if (v == "") return new Uint8Array(0)
    return Uint8Array.wrap(String.UTF8.encode(v));
}

function isDigit(str: string, index: i32): boolean {
    const code = str.charCodeAt(index);
    return code >= 48 && code <= 57;
}

export function parseDurationToMs(duration: string): i64 {
    const len = duration.length;
    if (len == 0) return i64(0);

    let unit = ""
    if (isDigit(duration, len-1)) {
        // this is in nanoseconds
        return I64.parseInt(duration) / 1000 // miliseconds
    }
    unit = duration.substr(len-1);
    if (!isDigit(duration, len-2)) {
        unit = duration.substr(len-2);
    }

    let valueStr: string;

    if (unit == "ms" || unit == "ns") {
        valueStr = duration.substr(0, len - 2);
    } else {
        if (unit.length > 1) {
            throw new Error("Invalid duration format: " + duration);
        }
        const singleUnit = duration.substr(len - 1); // Last character
        if (singleUnit == "s" || singleUnit == "m" || singleUnit == "h") {
            valueStr = duration.substr(0, len - 1);
        } else {
            throw new Error("Invalid duration format: " + duration);
        }
    }

    const value = I64.parseInt(valueStr); // Parse the numeric part

    if (unit == "ns") return value / 1000; // nanoseconds
    if (unit == "ms") return value; // Milliseconds, no conversion
    if (unit == "s") return value * 1000;
    if (unit == "m") return value * 60 * 1000;
    if (unit == "h") return value * 60 * 60 * 1000;
    throw new Error("Unsupported time unit: " + unit);
}
