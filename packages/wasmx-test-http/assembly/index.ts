import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import { revert } from "./utils";
import { HttpRequest } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function wasmx_http_1(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.HttpRequest !== null) {
    result = HttpRequest(calld.HttpRequest!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
