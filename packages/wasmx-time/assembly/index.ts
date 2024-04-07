import { JSON } from "json-as/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as base64 from "as-base64/assembly";
import { Block } from "./types";
import { getEmtpyBlock, getNewBlock } from "./blocks";
import { getParams } from "./storage";
import { BigInt } from "wasmx-env/assembly/bn";

export function wasmx_env_2(): void {}
export function instantiate(): void {
  // setup chainid
}

// shared array // TODO security issues?
export const sharedArray = new ArrayBuffer(32); // An example array

var count: i32 = 0;
var maxBlockCount: i32 = 256;
var blockCount: i32 = 0;
// timestamp ?
var blocksMap: Map<BigInt,Block> = new Map<BigInt,Block>()
var chain_id: string = ""
var previousBlock: Block = getEmtpyBlock("");
var cycleCount: i64 = 0;

export function main(): void {
  chain_id = getParams().chain_id;
  previousBlock = getEmtpyBlock(chain_id);

  Uint8Array.wrap(sharedArray).set([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1])

  const lcount = 200
  for (let i = 0; i < lcount; i++) {
  // while (true) {
    // const res = wasmx.sha256(sharedArray);
    // console.log("hash: " + count.toString() + ": " + base64.encode(Uint8Array.wrap(res)) + "--" + Uint8Array.wrap(sharedArray).toString())
    produceBlock(previousBlock)
    cycleCount += 1;
  }
}

function produceBlock(prevBlock: Block): void {
  const block = getNewBlock(prevBlock, chain_id, sharedArray);
  previousBlock = block;
  // if (blocksMap.length > maxBlockCount) {
    // TODO
  // }
  // blocksQueue.push(block);
}

export function increment(): void {
    count += 1;
}

export function getCount(): i32 {
    return count;
}

// optional
export function storeSharedArray(val: ArrayBuffer): void {
  let buffer = Uint8Array.wrap(sharedArray);
  buffer.set(Uint8Array.wrap(val), 0)
}

export function getSharedArray(): ArrayBuffer {
  return sharedArray
}
