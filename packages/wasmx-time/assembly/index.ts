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

// TODO security issues?
export const entropyArray = new ArrayBuffer(32);

export const lastBlock = new ArrayBuffer(1024);
export var lastBlockLength = 0;

// 300 * 255 = 76500
export const lastBlocks = new ArrayBuffer(76500);
export const lastBlocksLength = 0;
export const SEPARATOR = "[xxxxx]";

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
  LoggerInfo("sending background process request", ["contract", contract])
  wasmxw.startBackgroundProcess(contract, `{"start":{}}`);
}

// TODO start should get the last timehash from someone else
export function start(): void {
  const params = getParams();
  chain_id = params.chain_id;
  previousBlock = getEmtpyBlock(chain_id);
  LoggerInfo("starting", ["chain_id", chain_id])

  resetEntropy()

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
  const entropy = new Uint8Array(32);
  entropy.set(Uint8Array.wrap(entropyArray))
  resetEntropy()
  const block = getNewBlock(time, previousBlock!, chain_id, entropy);

  if ((blockCount + 1) > maxBlockCount) {
    const keyDelete = blocksMap.keys()[0]
    blocksMap.delete(keyDelete);
    blockCount -= 1;
    removeFirstBlock();
  }
  console.log("hash: " + block.hash + ": " + block.header.entropy + ": " + block.header.time.toISOString() + "--index: " + block.header.index.toString() + "---cycle: " + cycleCount.toString())
  const blockstr = JSON.stringify<Block>(block);
  blocksMap.set(block.header.time.toISOString(), blockstr);
  addLastBlock(blockstr);

  const data = Uint8Array.wrap(String.UTF8.encode(blockstr));
  Uint8Array.wrap(lastBlock).set(data)
  lastBlockLength = data.length;

  blockCount += 1;
  previousBlock = block;
}

function removeFirstBlock(): void {

}

function addLastBlock(blockstr: string): void {
  const blockdata = Uint8Array.wrap(String.UTF8.encode(blockstr));
  const sep = Uint8Array.wrap(String.UTF8.encode(SEPARATOR));
  const data = new Uint8Array(blockdata.length + sep.length);
  data.set(sep)
  data.set(blockdata, sep.length);
  Uint8Array.wrap(lastBlocks).set(data, lastBlocksLength);
  lastBlockLength += data.length;
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

function resetEntropy(): void {
  Uint8Array.wrap(entropyArray).set([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
}

// optional
export function storeEntropyArray(val: ArrayBuffer): void {
  let buffer = Uint8Array.wrap(entropyArray);
  buffer.set(Uint8Array.wrap(val), 0)
}

export function getEntropyArray(): ArrayBuffer {
  return entropyArray
}
