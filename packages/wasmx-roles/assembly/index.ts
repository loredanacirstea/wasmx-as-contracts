import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { RolesGenesis } from "wasmx-env/assembly/types";
import { getCallDataWrap } from './calldata';
import { GetAddressOrRole, GetRoleByLabel, GetRoleLabelByContract, GetRoles, initialize, RegisterRole } from "./actions";
import { revert } from "./utils";

export function memory_assemblyscript_1(): void {}

export function wasmx_env_i32_2(): void {}

export function wasmx_env_core_i32_1(): void {}

export function instantiate(): void {
  const calldraw = wasmx.getCallData();
  const calld = JSON.parse<RolesGenesis>(String.UTF8.decode(calldraw));
  initialize(calld.roles, calld.previous_contract);
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.RegisterRole != null) {
    result = RegisterRole(calld.RegisterRole!);
  } else if (calld.GetAddressOrRole != null) {
    result = GetAddressOrRole(calld.GetAddressOrRole!);
  } else if (calld.GetRoleLabelByContract != null) {
    result = GetRoleLabelByContract(calld.GetRoleLabelByContract!);
  } else if (calld.GetRoleByLabel != null) {
    result = GetRoleByLabel(calld.GetRoleByLabel!);
  } else if (calld.GetRoles != null) {
    result = GetRoles();
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
