import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { GetSubChainIds, GetSubChains, InitSubChain } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.InitSubChain !== null) {
    InitSubChain(calld.InitSubChain!);
    result = new ArrayBuffer(0)
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
