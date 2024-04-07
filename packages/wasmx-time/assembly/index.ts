import { JSON } from "json-as/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as base64 from "as-base64/assembly";

// shared array
export const sharedArray = new ArrayBuffer(32); // An example array

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  Uint8Array.wrap(sharedArray).set([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1])

  const lcount = 200
  for (let i = 0; i < lcount; i++) {
  // while (true) {
    const res = wasmx.sha256(sharedArray);
    console.log("hash: " + count.toString() + ": " + base64.encode(Uint8Array.wrap(res)) + "--" + Uint8Array.wrap(sharedArray).toString())
  }
}

// Define a global variable
var count: i32 = 0;

export function increment(): void {
    count += 1;
}

export function getCount(): i32 {
    return count;
}

// Store and retrieve a value in shared memory
export function storeArr(val: ArrayBuffer): void {
  let buffer = Uint8Array.wrap(sharedArray);
  buffer.set(Uint8Array.wrap(val), 0)
}

export function getArr(): ArrayBuffer {
  return sharedArray
}
