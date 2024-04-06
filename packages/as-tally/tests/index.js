import assert from "assert";
import { add, sub, div, mul, exp, toString10, toString16, fromString } from "../build/debug.js";

let result;

let tt = [67,33,88,99]
// tt = [67,33]
tt = [1, 8, 5, 9, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 3, 1]
result = toString10(new Uint8Array(tt).buffer);
assert.strictEqual(decodeFromUtf8Array(result), "2003526552471282244840952008190569146760252174969915492572205006122668019137294631681");

result = toString16(new Uint8Array(tt).buffer);
assert.strictEqual(decodeFromUtf8Array(result), "10805090302000000000000000000000000000000000000000000000000000000040301");

let ttstr = "24900552009816332"
// ttstr = "23"
// ttstr = "0x5876eb8d41990c"
result = fromString(encodeToUtf8Array(ttstr).buffer);
assert.strictEqual(decodeFromUtf8Array(result), ttstr);

// add
result = add(new Uint8Array([1]).buffer, new Uint8Array([2]).buffer, 0)
assert.strictEqual(decodeFromUtf8Array(result), "03");

result = add(hexToUint8Array("09d11b1a5ef44f6bf02bd225b55c04d38a737d99f3c378456b4f5f7cf9c1fe03"), hexToUint8Array("18b6a4a190a001b085f7996423266d84c00642b0caddbf68dd258dcbeb112fc6"), 32)
assert.strictEqual(decodeFromUtf8Array(result), "2287bfbbef94511c76236b89d88272584a79c04abea137ae4874ed48e4d32dc9");

// sub
result = sub(hexToUint8Array("0000000000000000000000000000000000000000000000000000000000000004"), hexToUint8Array("0000000000000000000000000000000000000000000000000000000000000006"), 32)
assert.strictEqual(decodeFromUtf8Array(result), "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe");

// mul
result = mul(hexToUint8Array("0000000000000000000000000000000000000000000000000000000000000003"), hexToUint8Array("000000000000000000000000000000000000000000000000000000000000001b"), 32)
assert.strictEqual(decodeFromUtf8Array(result), "0000000000000000000000000000000000000000000000000000000000000051");

result = mul(hexToUint8Array("0000000000000000000000000000000000000000000000000000000000000003"), hexToUint8Array("fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9"), 32)
assert.strictEqual(decodeFromUtf8Array(result), "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeb");

// exp
result = exp(hexToUint8Array("0000000000000000000000000000000000000000000000000000000000000100"), hexToUint8Array("0000000000000000000000000000000000000000000000000000000000000000"), 32)
assert.strictEqual(decodeFromUtf8Array(result), "0000000000000000000000000000000000000000000000000000000000000001");

// div
result = div(hexToUint8Array("fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9"),hexToUint8Array("00000000000000000000000000000000000000000ffffffffffffffffffffff9"), 32)
assert.strictEqual(decodeFromUtf8Array(result), "0000000000000000000000100000000000000000000007000000000000000000");

result = div(hexToUint8Array("fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9"),hexToUint8Array("00000000000000000000000000000000000000000000000000000000000038ad"), 32)
assert.strictEqual(decodeFromUtf8Array(result), "00048454e76bee00bdb5edf7b50c1f1fd90aa3b3fd1b399bbedb878677738d50");

result = div(hexToUint8Array("fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff9"),hexToUint8Array("118ffffffffffffffffffff5ffffffffffffffffffffffffffffffffffffff29"), 32)
assert.strictEqual(decodeFromUtf8Array(result), "000000000000000000000000000000000000000000000000000000000000000e");

console.log("ok");

export function encodeToUtf8Array(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

export function decodeFromUtf8Array(arr) {
    const encoder = new TextDecoder();
    return encoder.decode(arr);
}

export function hexToUint8Array(hexString) {
    const encodedString = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
    return new Uint8Array(encodedString);
}
