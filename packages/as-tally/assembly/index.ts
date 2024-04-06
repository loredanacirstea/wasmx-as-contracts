import tally from './tally';
import * as utils from './tally';

export function add(a: ArrayBuffer, b: ArrayBuffer, byteLength: i32): ArrayBuffer {
    const aa = tally.fromUint8Array(Uint8Array.wrap(a))
    const bb = tally.fromUint8Array(Uint8Array.wrap(b))
    const result = aa.add(bb)
    return String.UTF8.encode(result.toString(16, byteLength, false, false))
}

export function sub(a: ArrayBuffer, b: ArrayBuffer, byteLength: i32): ArrayBuffer {
    const aa = tally.fromUint8Array(Uint8Array.wrap(a), 32, false)
    const bb = tally.fromUint8Array(Uint8Array.wrap(b), 32, false)
    const result = aa.sub(bb)
    return String.UTF8.encode(result.toString(16, byteLength, false, false))
}

export function mul(a: ArrayBuffer, b: ArrayBuffer, byteLength: i32): ArrayBuffer {
    const aa = tally.fromUint8Array(Uint8Array.wrap(a), 32, false)
    const bb = tally.fromUint8Array(Uint8Array.wrap(b), 32, false)
    const result = aa.mul(bb)
    return String.UTF8.encode(result.toString(16, byteLength, false, false))
}

export function div(a: ArrayBuffer, b: ArrayBuffer, byteLength: i32): ArrayBuffer {
    const aa = tally.fromUint8Array(Uint8Array.wrap(a), 32, false)
    const bb = tally.fromUint8Array(Uint8Array.wrap(b), 32, false)
    const result = aa.div(bb)
    return String.UTF8.encode(result.toString(16, byteLength, false, false))
}

export function exp(a: ArrayBuffer, b: ArrayBuffer, byteLength: i32): ArrayBuffer {
    const aa = tally.fromUint8Array(Uint8Array.wrap(a), 32, false)
    const bb = tally.fromUint8Array(Uint8Array.wrap(b), 32, false)
    const result = aa.pow(bb)
    return String.UTF8.encode(result.toString(16, byteLength, false, false))
}

export function toString10(byteArray: ArrayBuffer): ArrayBuffer {
    const t = tally.fromUint8Array(Uint8Array.wrap(byteArray))
    return String.UTF8.encode(t.toString(10))
}

export function toString16(byteArray: ArrayBuffer): ArrayBuffer {
    const t = tally.fromUint8Array(Uint8Array.wrap(byteArray))
    return String.UTF8.encode(t.toString(16))
}

export function fromString(str: ArrayBuffer): ArrayBuffer {
    const t = tally.fromString(String.UTF8.decode(str))
    return String.UTF8.encode(t.toString(10))
}
