import { JSON } from "json-as";
import * as base64 from "as-base64/assembly";
import { Bech32String, Role } from "wasmx-env/assembly/types";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { base64ToString, bytes, concatBytes } from "wasmx-utils/assembly/utils";
import { revert } from "./utils";

// A role can be filled by multiple contracts
// but only one contract is a primary contract
// labels must be unique for each contract, as an alias

// role => Role
// label => role
// contractAddress => label
// * addRole
// * removeRole
// * replaceRole

// first 3 are temporary prefixes used in the Go core at bootstrap time
export const rolePrefix: u8 = 4
export const roleNamePrefix: u8 = 5
export const labelPrefix: u8 = 6
export const migrationExceptionPrefix: u8 = 7

// role => Role
export const KeyRolePrefix = bytes([rolePrefix]);
// label => role
export const KeyRoleNamePrefix = bytes([roleNamePrefix]);
// contractAddress => label
// use bech32 prefixed address, to support interchain roles
export const KeyLabelPrefix = bytes([labelPrefix]);
export const KeyMigrationExceptionPrefix = bytes([migrationExceptionPrefix]);

export function getRoleKey(): Uint8Array {
    return KeyRolePrefix
}

export function getRoleNameKey(): Uint8Array {
    return KeyRoleNamePrefix
}

export function getLabelKey(): Uint8Array {
    return KeyLabelPrefix
}

export function getMigrationExceptionKey(): Uint8Array {
    return KeyMigrationExceptionPrefix
}

export function getRoleKeyByRoleName(role: string): Uint8Array {
    return concatBytes(getRoleKey(), Uint8Array.wrap(String.UTF8.encode(role)));
}

export function getRoleNameKeyByLabel(label: string): Uint8Array {
    return concatBytes(getRoleNameKey(), Uint8Array.wrap(String.UTF8.encode(label)));
}

export function getLabelKeyByAddress(addr: Bech32String): Uint8Array {
    return concatBytes(getLabelKey(), Uint8Array.wrap(String.UTF8.encode(addr)));
}

export function getRoles(): Role[] {
    const roles = new Array<Role>(0)
    const startKey = base64.encode(getRoleKey())
    const endKey =  base64.encode(getRoleNameKey())
    const values = wasmxw.sloadRange(startKey, endKey, false)
    for (let i = 0; i < values.length; i++) {
        const value = JSON.parse<Role>(base64ToString(values[i]))
        roles.push(value);
    }
    return roles;
}

// set, get, delete role
export function setRole(role: Role): void {
    // delete if exists
    deleteRole(role.role)
    const count = role.labels.length;
    if (count != role.addresses.length) {
        revert(`role label count different than address count`);
    }
    setRoleByRoleName(role);
    for (let i = 0; i < count; i++) {
        const label = role.labels[i]
        const addr = role.addresses[i]
        setRoleNameByLabel(role.role, label)
        setLabelByContractAddress(label, addr)
    }
}

export function addRoleContract(role: Role, label: string, addr: Bech32String, replacePrimary: boolean): void {
    const ndx = role.addresses.indexOf(addr)
    if (ndx < 0) {
        role.labels.push(label)
        role.addresses.push(addr)
        if (replacePrimary) {
            role.primary = role.addresses.length - 1
        }
        setRoleByRoleName(role);
        setRoleNameByLabel(role.role, label)
        setLabelByContractAddress(label, addr)
        return
    }
    // if address exists already, we just update the label
    const oldlabel = role.labels[ndx]
    role.labels[ndx] = label
    if (replacePrimary) {
        role.primary = ndx
    }
    deleteRoleNameByLabel(oldlabel);
    setRoleNameByLabel(role.role, label)
    setLabelByContractAddress(label, addr)
}

export function removeRoleContract(role: Role, addr: Bech32String): string {
    let label = "";
    for (let i = 0; i < role.labels.length; i++) {
        if (role.addresses[i] == addr) {
            label = role.labels[i]
            role.labels.splice(i, 1)
            role.addresses.splice(i, 1)
            break;
        }
    }
    if (addr != "") {
        setRoleByRoleName(role);
        deleteRoleNameByLabel(label);
        deleteLabelByContractAddress(addr);
    }
    return label;
}

export function deleteRole(roleName: string): void {
    const role = getRoleByRoleName(roleName);
    if (role == null) return;
    deleteRoleByRoleName(roleName)
    for (let i = 0; i < role.labels.length; i++) {
        deleteRoleNameByLabel(role.labels[i])
        deleteLabelByContractAddress(role.addresses[i])
    }
}

export function getRoleByContractAddress(addr: Bech32String): string {
    const label = getLabelByContractAddress(addr)
    if (label == "") return "";
    const role = getRoleByLabel(label);
    if (role == null) {
        return ""
    }
    return role.role;
}

export function getContractAddressByLabel(label: string): Bech32String {
    const role = getRoleByLabel(label)
    if (role == null) return ""
    for (let i = 0; i < role.labels.length; i++) {
        if (role.labels[i] == label) {
            return role.addresses[i]
        }
    }
    return ""
}

export function getRoleByLabel(label: string): Role | null {
    const roleName = getRoleNameByLabel(label)
    return getRoleByRoleName(roleName)
}

// role => Role
export function setRoleByRoleName(role: Role): void {
    const key = getRoleKeyByRoleName(role.role)
    const data = JSON.stringify<Role>(role)
    wasmx.storageStore(key.buffer, String.UTF8.encode(data));
}

export function getRoleByRoleName(roleName: string): Role | null {
    const value = getRoleByRoleNameInner(roleName)
    if (value.byteLength == 0) return null;
    return JSON.parse<Role>(String.UTF8.decode(value))
}

export function getRoleByRoleNameInner(roleName: string): ArrayBuffer {
    const key = getRoleKeyByRoleName(roleName)
    return wasmx.storageLoad(key.buffer);
}

export function deleteRoleByRoleName(roleName: string): void {
    const key = getRoleKeyByRoleName(roleName)
    wasmx.storageDelete(key.buffer);
}

// label => role
export function setRoleNameByLabel(role: string, label: string): void {
    const key = getRoleNameKeyByLabel(label)
    const value = wasmx.storageLoad(key.buffer);
    if (value.byteLength > 0) {
        revert(`label '${label}' cannot be used for role '${role}': already used for role '${String.UTF8.decode(value)}'`)
    }
    wasmx.storageStore(key.buffer, String.UTF8.encode(role));
}

export function getRoleNameByLabel(label: string): string {
    const key = getRoleNameKeyByLabel(label)
    const value = wasmx.storageLoad(key.buffer);
    return String.UTF8.decode(value);
}

export function deleteRoleNameByLabel(label: string): void {
    const key = getRoleNameKeyByLabel(label)
    wasmx.storageDelete(key.buffer);
}

// contractAddress => label
export function setLabelByContractAddress(label: string, addr: Bech32String): void {
    const key = getLabelKeyByAddress(addr)
    wasmx.storageStore(key.buffer, String.UTF8.encode(label));
}

export function getLabelByContractAddress(addr: Bech32String): string {
    const key = getLabelKeyByAddress(addr)
    const value = wasmx.storageLoad(key.buffer);
    return String.UTF8.decode(value);
}

export function deleteLabelByContractAddress(addr: Bech32String): void {
    const key = getLabelKeyByAddress(addr)
    wasmx.storageDelete(key.buffer);
}

export function setMigrationException(value: string[]): void {
    const key = getMigrationExceptionKey()
    const data = JSON.stringify<string[]>(value);
    wasmx.storageStore(key.buffer, String.UTF8.encode(data))
}

export function getMigrationException(): string[] {
    const key = getMigrationExceptionKey()
    const value = wasmx.storageLoad(key.buffer)
    return JSON.parse<string[]>(String.UTF8.decode(value));
}
