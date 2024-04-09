import { JSON } from "json-as/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { Block, QueryBlockRequest } from "./types";
import { getEmtpyBlock, getNewBlock } from "./blocks";
import { getParams, setParams } from "./storage";
import { getCallDataInitialize, getCallDataWrap } from "./calldata";
import { LoggerInfo, revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const calld = getCallDataInitialize()
  setParams(calld.params)
}

// shared array // TODO security issues?
export const sharedArray = new ArrayBuffer(32);

export const lastBlock = new ArrayBuffer(1024);
export var lastBlockLength = 0;

var maxBlockCount: i32 = 256;
var blockCount: i32 = 0;
// timestamp => Block
var blocksMap: Map<string,string> = new Map<string,string>()
var chain_id: string = ""
var previousBlock: Block | null = null;
var cycleCount: i64 = 0;
var nextTime = Date.now();

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.StartNode !== null) {
    startNode();
    result = new ArrayBuffer(0)
  } else if (calld.start !== null) {
    start();
  } else if (calld.getLastBlock !== null) {
    result = getLastBlock();
  } else if (calld.getBlock !== null) {
    result = getBlock(calld.getBlock!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

// only view
export function peek(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  result = getLastBlock();
  wasmx.finish(result);
}

export function startNode(): void {
  const contract = wasmxw.getAddress()
  wasmxw.startBackgroundProcess(contract, `{"start":{}}`);
}

export function start(): void {
  const params = getParams();
  chain_id = params.chain_id;
  previousBlock = getEmtpyBlock(chain_id);
  LoggerInfo("starting", ["chain_id", chain_id])

  Uint8Array.wrap(sharedArray).set([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1])

  while (true) {
    cycleCount += 1;
    const time = Date.now();
    if (time < nextTime) continue;
    produceBlock(new Date(time));
    nextTime = time + params.interval_ms
    cycleCount = 0;
  }
}

// 2024-04-08T10:54:15.636Z // toISOString
function produceBlock(time: Date): void {
  const block = getNewBlock(time, previousBlock!, chain_id, sharedArray);

  if ((blockCount + 1) > maxBlockCount) {
    const keyDelete = blocksMap.keys()[0]
    blocksMap.delete(keyDelete);
    blockCount -= 1;
  }
  const blockstr = JSON.stringify<Block>(block);
  blocksMap.set(block.header.time.toISOString(), blockstr);

  const data = Uint8Array.wrap(String.UTF8.encode(blockstr));
  Uint8Array.wrap(lastBlock).set(data)
  lastBlockLength = data.length;

  blockCount += 1;
  previousBlock = block;
}

export function getLastBlock(): ArrayBuffer {
  const keys = blocksMap.keys()
  const key = keys[keys.length - 1];
  if (!blocksMap.has(key)) {
    return String.UTF8.encode("block not found")
  }
  const block = blocksMap.get(key);
  return String.UTF8.encode(block);
}

export function getBlock(req: QueryBlockRequest): ArrayBuffer {
  const key = req.time.toISOString();
  const block = blocksMap.get(key);
  return String.UTF8.encode(block);
}

export function getCycleCount(): i64 {
    return cycleCount;
}

// optional
export function storeSharedArray(val: ArrayBuffer): void {
  let buffer = Uint8Array.wrap(sharedArray);
  buffer.set(Uint8Array.wrap(val), 0)
}

export function getSharedArray(): ArrayBuffer {
  return sharedArray
}
