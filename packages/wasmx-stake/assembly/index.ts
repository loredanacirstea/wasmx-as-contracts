import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { InitGenesis, CreateValidator, UpdateValidators, GetAllValidators, GetValidator, GetDelegation, GetPool } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.CreateValidator !== null) {
    CreateValidator(calld.CreateValidator!);
    result = new ArrayBuffer(0)
  } else if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else if (calld.GetAllValidators !== null) {
    result = GetAllValidators();
  } else if (calld.GetValidator !== null) {
    result = GetValidator(calld.GetValidator!);
  } else if (calld.GetDelegation !== null) {
    result = GetDelegation(calld.GetDelegation!);
  } else if (calld.GetPool !== null) {
    result = GetPool(calld.GetPool!);
  } else if (calld.UpdateValidators !== null) {
    result = UpdateValidators(calld.UpdateValidators!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
