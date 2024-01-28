import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { InitGenesis, CreateValidator, UpdateValidators } from "./actions";
import { GetAllValidators } from "./queries";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer;
  const calld = getCallDataWrap();
  if (calld.CreateValidator !== null) {
    CreateValidator(calld.CreateValidator!);
    result = new ArrayBuffer(0)
  } else if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else if (calld.GetAllValidators !== null) {
    result = GetAllValidators();
  } else if (calld.UpdateValidators !== null) {
    result = UpdateValidators(calld.UpdateValidators!);
  } else {
    wasmx.revert(String.UTF8.encode("invalid function call data"));
    throw new Error("invalid function call data");
  }
  wasmx.finish(result);
}
