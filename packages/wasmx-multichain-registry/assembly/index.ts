import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataInitialize, getCallDataWrap } from './calldata';
import { GetSubChainById, GetSubChainIds, GetSubChains, InitSubChain, RegisterSubChain, RegisterSubChainValidator, RemoveSubChain } from "./actions";
import { revert } from "./utils";
import { setParams } from "./storage";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const calld = getCallDataInitialize()
  setParams(calld.params);
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.InitSubChain !== null) {
    result = InitSubChain(calld.InitSubChain!);
  } else if (calld.RegisterSubChain !== null) {
    result = RegisterSubChain(calld.RegisterSubChain!);
  } else if (calld.RegisterSubChainValidator !== null) {
    result = RegisterSubChainValidator(calld.RegisterSubChainValidator!);
  } else if (calld.RemoveSubChain !== null) {
    result = RemoveSubChain(calld.RemoveSubChain!);
  } else if (calld.GetSubChainById !== null) {
    result = GetSubChainById(calld.GetSubChainById!);
  } else if (calld.GetSubChains !== null) {
    result = GetSubChains(calld.GetSubChains!);
  } else if (calld.GetSubChainIds !== null) {
    result = GetSubChainIds(calld.GetSubChainIds!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
