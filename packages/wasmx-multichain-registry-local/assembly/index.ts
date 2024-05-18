import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataInitialize, getCallDataWrap } from './calldata';
import { revert } from "./utils";
import { setChainIds } from "./storage";
import { addSubChainId, getSubChainIds } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const calld = getCallDataInitialize()
  setChainIds(calld.ids);
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.AddSubChainId !== null) {
    result = addSubChainId(calld.AddSubChainId!);
  } else if (calld.GetSubChainIds !== null) {
    result = getSubChainIds(calld.GetSubChainIds!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
