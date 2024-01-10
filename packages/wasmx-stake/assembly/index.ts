import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { createValidator } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {

}

export function main(): void {
  let result: ArrayBuffer;
  const calld = getCallDataWrap();
  if (calld.createValidator !== null) {
    createValidator(calld.createValidator);
    result = new ArrayBuffer(0)
  } else {
    wasmx.revert(String.UTF8.encode("invalid function call data"));
    throw new Error("invalid function call data");
  }
  wasmx.finish(result);
}
