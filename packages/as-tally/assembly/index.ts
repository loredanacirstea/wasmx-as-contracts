import tally from './tally';

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
