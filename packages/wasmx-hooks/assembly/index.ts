import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataInitialize, getCallDataWrap } from './calldata';
import { GetHookModules, GetHooks, Initialize, RunHook, SetHook } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const calld = getCallDataInitialize()
  Initialize(calld);
}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.SetHook !== null) {
    result = SetHook(calld.SetHook!);
  } else if (calld.RunHook !== null) {
    result = RunHook(calld.RunHook!);
  } else if (calld.GetHooks !== null) {
    result = GetHooks(calld.GetHooks!);
  } else if (calld.GetHookModules !== null) {
    result = GetHookModules(calld.GetHookModules!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
