import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { bootstrapAfterStateSync, CallDataInstantiate, getCallDataWrap } from './calldata';
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
import { setLastBlockIndex, getContextValue } from "./storage";
import { revert } from "./utils";
import { onlyInternal } from "wasmx-env/assembly/utils";
import { MODULE_NAME } from "./types";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const calldraw = wasmx.getCallData();
  const calld = JSON.parse<CallDataInstantiate>(String.UTF8.decode(calldraw));
  setLastBlockIndex(calld.initialBlockIndex);
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const calld = getCallDataWrap();

  // public operations
  if (calld.getLastBlockIndex !== null) {
    result = getLastBlockIndexWrap();
  } else if (calld.getBlockByIndex !== null) {
    result = getBlockByIndexWrap(calld.getBlockByIndex!.index);
  } else if (calld.getBlockByHash !== null) {
    result = getBlockByHashWrap(calld.getBlockByHash!.hash);
  } else if (calld.getIndexedTransactionByHash !== null) {
    result = getIndexedTransactionByHashWrap(calld.getIndexedTransactionByHash!.hash);
  } else if (calld.getConsensusParams !== null) {
    result = getConsensusParamsWrap(calld.getConsensusParams!);
  } else if (calld.getIndexedData !== null) {
    result = getIndexedDataWrap(calld.getIndexedData!.key);
  } else if (calld.getContextValue !== null) {
    result = getContextValue(calld.getContextValue!.key);
  }

  // internal operations
  else if (calld.setBlock !== null) {
    onlyInternal(MODULE_NAME, "setBlock");
    result = setBlockWrap(calld.setBlock!.value, calld.setBlock!.hash, calld.setBlock!.txhashes, calld.setBlock!.indexed_topics);
  } else if (calld.setConsensusParams !== null) {
    onlyInternal(MODULE_NAME, "setConsensusParams");
    result = setConsensusParamsWrap(calld.setConsensusParams!);
  } else if (calld.setIndexedTransactionByHash !== null) {
    onlyInternal(MODULE_NAME, "setIndexedTransactionByHash");
    result = setIndexedTransactionByHashWrap(calld.setIndexedTransactionByHash!.hash, calld.setIndexedTransactionByHash!.data);
  } else if (calld.setIndexedData !== null) {
    onlyInternal(MODULE_NAME, "setIndexedData");
    result = setIndexedDataWrap(calld.setIndexedData!.key, calld.setIndexedData!.value);
  } else if (calld.bootstrapAfterStateSync !== null) {
    onlyInternal(MODULE_NAME, "bootstrapAfterStateSync");
    result = bootstrapAfterStateSync(calld.bootstrapAfterStateSync!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
