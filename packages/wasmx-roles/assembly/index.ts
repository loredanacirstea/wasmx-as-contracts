import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { RolesGenesis } from "wasmx-env/assembly/types";
import { getCallDataWrap } from './calldata';
import { GetAddressOrRole, GetRoleByLabel, GetRoleLabelByContract, GetRoles, initialize, SetRole, SetContractForRole, setup, EndBlock, GetRoleByRoleName } from "./actions";
import { revert } from "./utils";

export function memory_assemblyscript_1(): void {}

export function wasmx_env_i32_2(): void {}

export function wasmx_env_core_i32_1(): void {}

export function instantiate(): void {
  const calldraw = wasmx.getCallData();
  const calld = JSON.parse<RolesGenesis>(String.UTF8.decode(calldraw));
  initialize(calld.roles);
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.SetContractForRole != null) {
    result = SetContractForRole(calld.SetContractForRole!);
  } else if (calld.SetRole != null) {
    result = SetRole(calld.SetRole!);
  } else if (calld.GetRoleByRoleName != null) {
    result = GetRoleByRoleName(calld.GetRoleByRoleName!);
  } else if (calld.GetAddressOrRole != null) {
    result = GetAddressOrRole(calld.GetAddressOrRole!);
  } else if (calld.GetRoleLabelByContract != null) {
    result = GetRoleLabelByContract(calld.GetRoleLabelByContract!);
  } else if (calld.GetRoleByLabel != null) {
    result = GetRoleByLabel(calld.GetRoleByLabel!);
  } else if (calld.GetRoles != null) {
    result = GetRoles();
  } else if (calld.setup != null) {
    result = setup(calld.setup!);
  } else if (calld.EndBlock !== null) {
    EndBlock(calld.EndBlock!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
