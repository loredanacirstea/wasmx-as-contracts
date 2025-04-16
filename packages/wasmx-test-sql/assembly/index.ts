import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import { revert } from "./utils";
import { Connect, Execute, Query, Ping, Close } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function wasmx_sql_1(): void {}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.Connect !== null) {
    result = Connect(calld.Connect!);
  } else if (calld.Close !== null) {
    result = Close(calld.Close!);
  } else if (calld.Ping !== null) {
    result = Ping(calld.Ping!);
  } else if (calld.Execute !== null) {
    result = Execute(calld.Execute!);
  } else if (calld.Query !== null) {
    result = Query(calld.Query!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
