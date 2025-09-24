import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import { revert } from "./utils";
import { Connect, Execute, Query, Ping, Close, NestedCall, BatchAtomic, CreateDatabase } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function wasmx_postgresql_i32_1(): void {}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.Connect !== null) {
    result = Connect(calld.Connect!);
  } else if (calld.Close !== null) {
    result = Close(calld.Close!);
  } else if (calld.CreateDatabase !== null) {
    result = CreateDatabase(calld.CreateDatabase!);
  } else if (calld.Ping !== null) {
    result = Ping(calld.Ping!);
  } else if (calld.Execute !== null) {
    result = Execute(calld.Execute!);
  } else if (calld.BatchAtomic !== null) {
    result = BatchAtomic(calld.BatchAtomic!);
  } else if (calld.Query !== null) {
    result = Query(calld.Query!);
  } else if (calld.NestedCall !== null) {
    result = NestedCall(calld.NestedCall!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
