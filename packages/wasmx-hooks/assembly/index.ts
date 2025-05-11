import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataInitialize, getCallDataWrap } from './calldata';
import { GetHookModules, GetHooks, Initialize, RunHook, SetHook } from "./actions";
import { revert } from "./utils";
import { onlyInternal } from "wasmx-env/assembly/utils";
import { MODULE_NAME } from "./types";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const calld = getCallDataInitialize()
  Initialize(calld);
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();

  // public operations
  if (calld.GetHooks !== null) {
    result = GetHooks(calld.GetHooks!);
  } else if (calld.GetHookModules !== null) {
    result = GetHookModules(calld.GetHookModules!);
  }

  // internal operations
  else if (calld.SetHook !== null) {
    onlyInternal(MODULE_NAME, "SetHook");
    result = SetHook(calld.SetHook!);
  } else if (calld.RunHook !== null) {
    onlyInternal(MODULE_NAME, "RunHook");
    result = RunHook(calld.RunHook!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
