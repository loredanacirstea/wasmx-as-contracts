import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as roles from "wasmx-env/assembly/roles";
import * as modules from "wasmx-env/assembly/modules";
import { RolesGenesis } from "wasmx-env/assembly/types";
import { getCallDataWrap } from './calldata';
import { GetAddressOrRole, GetRoleByLabel, GetRoleLabelByContract, GetRoles, initialize, SetRole, SetContractForRole, setup, EndBlock, GetRoleByRoleName, GetRoleNameByAddress, SetContractForRoleGov, IsInternalContract } from "./actions";
import { revert } from "./utils";
import { onlyInternal, onlyRole, isGoCoreModule } from "wasmx-env/assembly/utils";
import { MODULE_NAME } from "./types";

export function memory_assemblyscript_1(): void {}

export function wasmx_env_i32_2(): void {}

export function wasmx_env_core_i32_1(): void {}

export function instantiate(): void {
  const calldraw = wasmx.getCallData();
  const calld = JSON.parse<RolesGenesis>(String.UTF8.decode(calldraw));
  initialize(calld.roles, calld.individual_migration);
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();

  // public operations
  if (calld.GetRoleByRoleName != null) {
    result = GetRoleByRoleName(calld.GetRoleByRoleName!);
  } else if (calld.GetAddressOrRole != null) {
    result = GetAddressOrRole(calld.GetAddressOrRole!);
  } else if (calld.GetRoleNameByAddress != null) {
    result = GetRoleNameByAddress(calld.GetRoleNameByAddress!);
  } else if (calld.GetRoleLabelByContract != null) {
    result = GetRoleLabelByContract(calld.GetRoleLabelByContract!);
  } else if (calld.GetRoleByLabel != null) {
    result = GetRoleByLabel(calld.GetRoleByLabel!);
  } else if (calld.IsInternalContract != null) {
    result = IsInternalContract(calld.IsInternalContract!);
  }else if (calld.GetRoles != null) {
    result = GetRoles();
  }

  // internal operations
  else if (calld.SetContractForRole != null) {
    // called by other contracts who want to change a role, during block execution
    onlyInternal(MODULE_NAME, "SetContractForRole");
    result = SetContractForRole(calld.SetContractForRole!);
  } else if (calld.SetContractForRoleGov != null) {
    // called through governance proposal, to be executed immediately during EndBlock
    const fromGovModule = isGoCoreModule(wasmx.getCaller(), modules.MODULE_GOV)
    if (!fromGovModule) {
      onlyRole(MODULE_NAME, roles.ROLE_GOVERNANCE, "SetContractForRoleGov");
    }
    result = SetContractForRoleGov(calld.SetContractForRoleGov!);
  } else if (calld.SetRole != null) {
    onlyInternal(MODULE_NAME, "SetRole");
    result = SetRole(calld.SetRole!);
  } else if (calld.setup != null) {
    onlyInternal(MODULE_NAME, "setup");
    result = setup(calld.setup!);
  } else if (calld.EndBlock !== null) {
    onlyInternal(MODULE_NAME, "EndBlock");
    EndBlock(calld.EndBlock!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
