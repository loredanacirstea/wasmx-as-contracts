import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import { revert } from "./utils";
import { Connect, Close, NestedCall, Get, Has, Set } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function wasmx_kvdb_i32_1(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.Connect !== null) {
    result = Connect(calld.Connect!);
  } else if (calld.Close !== null) {
    result = Close(calld.Close!);
  } else if (calld.Get !== null) {
    result = Get(calld.Get!);
  } else if (calld.Has !== null) {
    result = Has(calld.Has!);
  } else if (calld.Set !== null) {
    result = Set(calld.Set!);
  } else if (calld.NestedCall !== null) {
    result = NestedCall(calld.NestedCall!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
