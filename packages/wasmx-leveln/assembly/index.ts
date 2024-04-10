import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  // const calld = getCallDataInitialize()
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.method !== null) {
    // result = SetHook(calld.method!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
