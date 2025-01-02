import { JSON } from "json-as/assembly";
import { Bech32String, ContractStorageTypeByString, Event, EventAttribute, Role } from "wasmx-env/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as wasmxcorew from 'wasmx-env-core/assembly/wasmxcore_wrap';
import * as wasmxcoret from "wasmx-env-core/assembly/types";
import * as st from "./storage";
import { GetAddressOrRoleRequest, GetRoleByLabelRequest, GetRoleLabelByContractRequest, RegisterRoleRequest } from "./types";
import { LoggerInfo, revert } from "./utils";
import { AttributeKeyContractAddress, AttributeKeyLabel, AttributeKeyRole, EventTypeRegisterRole } from "./events";

export function initialize(roles: Role[]): ArrayBuffer {
    for (let i = 0; i < roles.length; i++) {
        registerRoleInitial(roles[i].role, roles[i].label, roles[i].contract_address);
    }
    return new ArrayBuffer(0);
}

export function RegisterRole(req: RegisterRoleRequest): ArrayBuffer {
    registerRole(req.role, req.label, req.contract_address);
    return new ArrayBuffer(0);
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
    registerRoleInternal(role, label, addr)
}

export function registerRoleMigration(role: string, addr: Bech32String): void {
    // get previous contract in the role, if exists
    const prevContract = st.getContractAddressByRole(role);
    if (prevContract == "" || prevContract == addr) {
        return;
    }

    // inherit storage type from previous contract
    const prevContractInfo = wasmxw.getContractInfo(prevContract)
    if (prevContractInfo == null) {
        revert(`cannot find contract info for ${prevContract}`);
        return
    }
    const contractInfo = wasmxw.getContractInfo(addr);
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

        wasmxcorew.setContractInfo(addr, contractInfo);
    }
}

export function registerRoleInternal(role: string, label: string, addr: Bech32String): void {
    const roleObj = new Role(role, label, addr);
    st.setContractAddressByRole(role, addr);
    st.setRoleByLabel(roleObj);
    st.setRoleLabelByContract(addr, label);
    wasmxw.emitCosmosEvents([
        new Event(
            EventTypeRegisterRole,
            [
                new EventAttribute(AttributeKeyRole, role, true),
                new EventAttribute(AttributeKeyLabel, label, true),
                new EventAttribute(AttributeKeyContractAddress, addr, true),
            ],
        )
    ]);
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
