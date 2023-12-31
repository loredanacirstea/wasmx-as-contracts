import { JSON } from "json-as/assembly";
import * as wasmx from './wasmx';
import { CallDataInstantiate, getCallDataWrap } from './calldata';
import {
  getLastBlockIndexWrap,
  getBlockByIndexWrap,
  getBlockByHashWrap,
  getIndexedTransactionByHashWrap,
  getConsensusParamsWrap,
  getIndexedDataWrap,
  setBlockWrap,
  setConsensusParamsWrap,
  setIndexedDataWrap,
  setIndexedTransactionByHashWrap,
} from './calldata';
import { setLastBlockIndex } from "./storage";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const calldraw = wasmx.getCallData();
  console.log("--instantiate---" + String.UTF8.decode(calldraw))
  const calld = JSON.parse<CallDataInstantiate>(String.UTF8.decode(calldraw));
  console.log("--instantiate2--")
  setLastBlockIndex(calld.initialBlockIndex);
}

export function main(): void {
  console.log("--main---")
  let result: ArrayBuffer;
  const calld = getCallDataWrap();
  if (calld.getLastBlockIndex !== null) {
    result = getLastBlockIndexWrap();
  } else if (calld.getBlockByIndex !== null) {
    result = getBlockByIndexWrap(calld.getBlockByIndex!.index);
  } else if (calld.getBlockByHash !== null) {
    result = getBlockByHashWrap(calld.getBlockByHash!.hash);
  } else if (calld.getIndexedTransactionByHash !== null) {
    result = getIndexedTransactionByHashWrap(calld.getIndexedTransactionByHash!.hash);
  } else if (calld.getConsensusParams !== null) {
    result = getConsensusParamsWrap();
  } else if (calld.getIndexedData !== null) {
    result = getIndexedDataWrap(calld.getIndexedData!.key);
  } else if (calld.setBlock !== null) {
    result = setBlockWrap(calld.setBlock!.value, calld.setBlock!.hash, calld.setBlock!.txhashes);
  } else if (calld.setConsensusParams !== null) {
    result = setConsensusParamsWrap(calld.setConsensusParams!.params);
  } else if (calld.setIndexedTransactionByHash !== null) {
    result = setIndexedTransactionByHashWrap(calld.setIndexedTransactionByHash!.hash, calld.setIndexedTransactionByHash!.data);
  } else if (calld.setIndexedData !== null) {
    result = setIndexedDataWrap(calld.setIndexedData!.key, calld.setIndexedData!.value);
  } else {
    wasmx.revert(String.UTF8.encode("invalid function call data"));
    throw new Error("invalid function call data");
  }
  wasmx.finish(result);
}
