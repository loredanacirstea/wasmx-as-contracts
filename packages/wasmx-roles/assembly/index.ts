import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as roles from "wasmx-env/assembly/roles";
import * as modules from "wasmx-env/assembly/modules";
import { RolesGenesis, Bech32String } from "wasmx-env/assembly/types";
import * as st from "./storage";
import { getCallDataWrap } from './calldata';
import { GetAddressOrRole, GetRoleByLabel, GetRoleLabelByContract, GetRoles, initialize, SetRole, SetContractForRole, setup, EndBlock, GetRoleByRoleName, GetRoleNameByAddress, SetContractForRoleGov, IsInternalContract } from "./actions";
import { revert } from "./utils";
import { onlyRole, isGoCoreModule } from "wasmx-env/assembly/utils";
import { onlyInternal as onlyInternalExternal } from "wasmx-env/assembly/utils";
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
    // in the setup phase, we need to use the previous roles contract in order to determine if
    // the caller has a role
    onlyInternalExternal(MODULE_NAME, "setup");
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

// used to restrict EOA calls to internal/core contract functions
export function onlyInternal(moduleName: string, message: string): void {
    // 32 bytes
    const callerBz = wasmx.getCaller()
    const caller = wasmxw.addr_humanize(callerBz)

    const addrBz = wasmx.getAddress()
    const addr = wasmxw.addr_humanize(addrBz)
    // happens when host uses the same address for modules; e.g. "auth" module before being initialized
    if (caller == addr) return;

    if (isGoCoreModule(callerBz, "")) return;
    if (hasRole(caller)) return;

    // caller does not have system role, we revert
    const msg = `${moduleName}: unauthorized caller: ${caller}: ${message}`
    wasmxw.LoggerDebug(moduleName, "revert", ["err", msg, "module", moduleName])
    wasmx.revert(String.UTF8.encode(msg));
    throw new Error(msg);
}

export function hasRole(addr: Bech32String): bool {
    const role = st.getRoleByContractAddress(addr)
    if (role.length > 0) return true;
    return false;
}
