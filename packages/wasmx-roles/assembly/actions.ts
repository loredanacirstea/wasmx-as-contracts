import { JSON } from "json-as/assembly";
import { Bech32String } from "wasmx-env/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as st from "./storage";
import { CallDataInstantiate, GetAddressOrRoleRequest, GetRoleByLabelRequest, GetRoleLabelByContractRequest, RegisterRoleRequest, Role } from "./types";
import { LoggerInfo, revert } from "./utils";

export function initialize(roles: Role[]): ArrayBuffer {
    for (let i = 0; i < roles.length; i++) {
        registerRole(roles[i].role, roles[i].label, roles[i].contract_address);
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
export function registerRole(role: string, label: string, addr: Bech32String): void {
    if (role == "") {
        revert(`cannot register empty role for ${addr}`)
    }
    if (label == "") {
        revert(`cannot register role ${role} with empty label for ${addr}`)
    }
    LoggerInfo("register role", ["role", role, "label", label, "contract_address", addr])
    const roleObj = new Role(role, label, addr);
    st.setContractAddressByRole(role, addr);
    st.setRoleByLabel(roleObj);
    st.setRoleLabelByContract(addr, label);
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
