import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import { Base64String, Bech32String, ContractInfo, ContractStorageTypeByString, Event, EventAttribute, Role, RolesGenesis } from "wasmx-env/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as roles from "wasmx-env/assembly/roles";
import * as hooks from "wasmx-env/assembly/hooks";
import * as wasmxevs from 'wasmx-env/assembly/events';
import * as wasmxcorew from 'wasmx-env-core/assembly/wasmxcore_wrap';
import * as wasmxcoret from "wasmx-env-core/assembly/types";
import * as codesregt from "wasmx-codes-registry/assembly/types";
import * as st from "./storage";
import { GetAddressOrRoleRequest, GetRoleByLabelRequest, GetRoleLabelByContractRequest, MODULE_NAME, RegisterRoleRequest } from "./types";
import { LoggerError, LoggerInfo, revert } from "./utils";
import { callContract } from "wasmx-env/assembly/utils";

export function initialize(rolesInitial: Role[], prevContract: Bech32String): ArrayBuffer {
    let foundself = false;
    // prevContract holds current role contract metadata, if exists
    if (prevContract != "") {
        // migrate from previous contract
        const oldroles = getOldRoles(prevContract);
        for (let i = 0; i < oldroles.length; i++) {
            const r = oldroles[i]
            if (r.role == roles.ROLE_ROLES) {
                foundself = true;
                r.contract_address = wasmxw.getAddress();
            }
            registerRoleInitial(r.role, r.label, r.contract_address);
        }
    }

    for (let i = 0; i < rolesInitial.length; i++) {
        const r = rolesInitial[i]
        if (r.role == roles.ROLE_ROLES) {
            foundself = true;
            r.contract_address = wasmxw.getAddress();
        }
        registerRoleInitial(r.role, r.label, r.contract_address);
    }
    if (!foundself) {
        registerRoleInitial(roles.ROLE_ROLES, roles.ROLE_ROLES + "_" + "rolesv0.0.1" , wasmxw.getAddress());
    }
    return new ArrayBuffer(0);
}

export function RegisterRole(req: RegisterRoleRequest): ArrayBuffer {
    registerRole(req.role, req.label, req.contract_address);
    return new ArrayBuffer(0);
}

export function GetRoles(): ArrayBuffer {
    const roles = st.getRoles();
    const data = new RolesGenesis(roles, "")
    return String.UTF8.encode(JSON.stringify<RolesGenesis>(data));
}

export function GetAddressOrRole(req: GetAddressOrRoleRequest): ArrayBuffer {
    const addr = getAddressOrRole(req.addressOrRole);
    return String.UTF8.encode(addr);
}

export function GetRoleLabelByContract(req: GetRoleLabelByContractRequest): ArrayBuffer {
    const value = st.getRoleLabelByContract(req.address);
    return String.UTF8.encode(value);
}

export function GetRoleByLabel(req: GetRoleByLabelRequest): ArrayBuffer {
    const value = st.getRoleByLabel(req.label);
    if (value == null) return new ArrayBuffer(0);
    return String.UTF8.encode(JSON.stringify<Role>(value));
}

// TODO replace the previous role? if a role cannot hold 2 contracts?
// e.g. consensus
export function registerRoleInitial(role: string, label: string, addr: Bech32String): void {
    if (role == "") {
        revert(`cannot register empty role for ${addr}`)
    }
    if (label == "") {
        revert(`cannot register role ${role} with empty label for ${addr}`)
    }
    LoggerInfo("register role initial", ["role", role, "label", label, "contract_address", addr])
    registerRoleInternal(role, label, addr)
    // we do not call the hooks contract here, as it may not be initialized yet
    // we use genesis data directly if we need other contracts to know about the roles
}

export function registerRole(role: string, label: string, addr: Bech32String): void {
    if (role == "") {
        revert(`cannot register empty role for ${addr}`)
    }
    if (label == "") {
        revert(`cannot register role ${role} with empty label for ${addr}`)
    }

    registerRoleMigration(role, addr);
    LoggerInfo("register role", ["role", role, "label", label, "contract_address", addr])
    const roleObj = registerRoleInternalWithEvent(role, label, addr);
    // we also call the hooks contract
    callHookContract(hooks.HOOK_ROLE_CHANGED, JSON.stringify<Role>(roleObj))
}

export function registerRoleMigration(role: string, addr: Bech32String): void {
    // get previous contract in the role, if exists
    const prevContract = st.getContractAddressByRole(role);
    if (prevContract == "" || prevContract == addr) {
        return;
    }

    // inherit storage type from previous contract
    const prevContractInfo = getContractInfo(prevContract)
    if (prevContractInfo == null) {
        revert(`cannot find contract info for ${prevContract}`);
        return
    }
    const contractInfo = getContractInfo(addr);
    if (contractInfo == null) {
        revert(`cannot find contract info for ${addr}`);
        return
    }
    // migrate storage if needed
    if (contractInfo.storage_type != prevContractInfo.storage_type) {
        LoggerInfo("migrating contract storage", ["address", addr, "source storage type", contractInfo.storage_type, "target storage type", prevContractInfo.storage_type])

        if (!ContractStorageTypeByString.has(contractInfo.storage_type)) {
            revert(`invalid source storage type ${contractInfo.storage_type}`)
        }
        if (!ContractStorageTypeByString.has(prevContractInfo.storage_type)) {
            revert(`invalid target storage type ${prevContractInfo.storage_type}`)
        }

        const sourceStorageType = ContractStorageTypeByString.get(contractInfo.storage_type)
        const targetStorageType = ContractStorageTypeByString.get(prevContractInfo.storage_type)

        wasmxcorew.migrateContractStateByStorageType(new wasmxcoret.MigrateContractStateByStorageRequest(addr, sourceStorageType, targetStorageType))

        contractInfo.storage_type = prevContractInfo.storage_type;
        LoggerInfo("contract storage migrated", ["address", addr]);

        setContractInfo(addr, contractInfo);
    }
}

export function registerRoleInternal(role: string, label: string, addr: Bech32String): Role {
    // const exists = st.getRoleByLabel(label)
    // if (exists != null && label != exists.label) {
    //     revert(`label is already assigned to a role: ${label}: ${exists.role}`);
    // }
    const roleObj = new Role(role, label, addr);
    st.setContractAddressByRole(role, addr);
    st.setRoleByLabel(roleObj);
    st.setRoleLabelByContract(addr, label);
    return roleObj;
}

export function registerRoleInternalWithEvent(role: string, label: string, addr: Bech32String): Role {
    const roleObj = registerRoleInternal(role, label, addr)
    wasmxw.emitCosmosEvents([
        new Event(
            wasmxevs.EventTypeRegisterRole,
            [
                new EventAttribute(wasmxevs.AttributeKeyRole, role, true),
                new EventAttribute(wasmxevs.AttributeKeyRoleLabel, label, true),
                new EventAttribute(wasmxevs.AttributeKeyContractAddress, addr, true),
            ],
        )
    ]);
    return roleObj;
}

export function deregisterRole(): void {
    // TODO
}

export function getAddressOrRole(addressOrRole: string): Bech32String {
    const addr = st.getContractAddressByRole(addressOrRole);
    if (addr.length > 0) return addr;
    const role = st.getRoleByLabel(addressOrRole);
    if (role != null) {
        return role.contract_address;
    }
    wasmxw.validate_bech32_address(addressOrRole);
    return addressOrRole;
}

export function callHookContract(hookName: string, data: string): void {
    callHookContractInternal(roles.ROLE_HOOKS, hookName, data)
}

export function callHookNonCContract(hookName: string, data: string): void {
    callHookContractInternal(roles.ROLE_HOOKS_NONC, hookName, data)
}

export function callHookContractInternal(contractRole: string, hookName: string, data: string): void {
    const dataBase64 = base64.encode(Uint8Array.wrap(String.UTF8.encode(data)))
    const calldatastr = `{"RunHook":{"hook":"${hookName}","data":"${dataBase64}"}}`;
    const resp = callContract(contractRole, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`hooks failed`, ["error", resp.data])
    }
}

export function getContractInfo(addr: Bech32String): ContractInfo | null {
    const addrb64 = base64.encode(Uint8Array.wrap(wasmxw.addr_canonicalize(addr)))
    const calldatastr = `{"GetContractInfo":{"address":"${addrb64}"}}`;
    const resp = callContract(roles.ROLE_STORAGE_CONTRACTS, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        LoggerError(`get contract info failed`, ["error", resp.data])
        return null;
    }
    const data = JSON.parse<codesregt.QueryContractInfoResponse>(resp.data)
    return data.contract_info
}

export function setContractInfo(addr: Bech32String, data: ContractInfo): void {
    const datastr = JSON.stringify<ContractInfo>(data)
    const calldatastr = `{"SetContractInfo":{"address":"${addr}","contract_info":${datastr}}}`;
    const resp = callContract(roles.ROLE_STORAGE_CONTRACTS, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`get contract info failed: ${resp.data}`)
    }
}

export function getOldRoles(addr: Bech32String): Role[] {
    const resp = callContract(addr, `{"GetRoles":{}}`, true, MODULE_NAME)
    if (resp.success > 0) {
        revert(`get contract info failed: ${resp.data}`)
    }
    const roles = JSON.parse<RolesGenesis>(resp.data)
    return roles.roles;
}
