import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { GetHookModules, GetHooks, InitGenesis, RunHook, SetHook } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer;
  const calld = getCallDataWrap();
  if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else if (calld.SetHook !== null) {
    result = SetHook(calld.SetHook!);
  } else if (calld.RunHook !== null) {
    result = RunHook(calld.RunHook!);
  } else if (calld.GetHooks !== null) {
    result = GetHooks(calld.GetHooks!);
  } else if (calld.GetHookModules !== null) {
    result = GetHookModules(calld.GetHookModules!);
  } else {
    wasmx.revert(String.UTF8.encode("invalid function call data"));
    throw new Error("invalid function call data");
  }
  wasmx.finish(result);
}
