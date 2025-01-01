import { JSON } from "json-as/assembly";
import { Bech32String, Role } from "wasmx-env/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";

// role => contract address
const KEY_CONTRACT_ADDRESS_BY_ROLE = "addrbyrole_"
// label => ROLE
const KEY_ROLE_BY_LABEL = "rolebylabel_"
// addr => label
const KEY_LABEL_BY_ADDR = "labelbyaddr_"

export function getKeyAddressByRole(role: string): string {
    return KEY_CONTRACT_ADDRESS_BY_ROLE + role;
}

export function getKeyRoleByLabel(label: string): string {
    return KEY_ROLE_BY_LABEL + label;
}

export function getKeyLabelByAddress(addr: Bech32String): string {
    return KEY_LABEL_BY_ADDR + addr;
}

export function setContractAddressByRole(role: string, addr: Bech32String): void {
    wasmxw.sstore(getKeyAddressByRole(role), addr);
}

export function getContractAddressByRole(role: string): Bech32String {
    return wasmxw.sload(getKeyAddressByRole(role));
}

export function getRoleByContractAddress(addr: Bech32String): string {
    const label = getRoleLabelByContract(addr)
    if (label == "") return "";
    const role = getRoleByLabel(label);
    if (role == null) {
        return ""
    }
    return role.role;
}

export function setRoleLabelByContract(addr: Bech32String, label: string): void {
    wasmxw.sstore(getKeyLabelByAddress(addr), label);
}

export function getRoleLabelByContract(addr: Bech32String): string {
    return wasmxw.sload(getKeyLabelByAddress(addr));
}

export function setRoleByLabel(role: Role): void {
    const value = JSON.stringify<Role>(role);
    wasmxw.sstore(getKeyRoleByLabel(role.label), value);
}

export function getRoleByLabel(label: string): Role | null {
    const value = wasmxw.sload(getKeyRoleByLabel(label));
    if (value == "") return null;
    return JSON.parse<Role>(value);
}
