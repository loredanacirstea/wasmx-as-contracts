import { JSON } from "json-as";
import { Base64String, Bech32String, Role, RoleChanged } from "wasmx-env/assembly/types";

export const MODULE_NAME = "roles"

export const ENTRY_POINT_ROLE_CHANGED = "role_changed"

export const AttributeKeyRoleMultipleLabels = "multiple_labels";
export const AttributeKeyRoleStorageType = "storage_type";

// for authorization purposes, when the old contract is replaced for a role in EndBlock
// the old contract may need to still perform actions even after EndBlock (e.g. consensus contract needs to call Commit) and it needs authorization, so for now, we just assign a previous role
export var ROLE_PREVIOUS = "previous_"

@json
export class RolesChangedHook {
    role: Role | null
    role_changed: RoleChanged | null
    constructor(role: Role | null, role_changed: RoleChanged | null) {
        this.role = role
        this.role_changed = role_changed
    }
}

@json
export class RolesChangedCalldata {
    RoleChanged: RolesChangedHook
    constructor(RoleChanged: RolesChangedHook) {
        this.RoleChanged = RoleChanged
    }
}

@json
export class SetRoleRequest {
    role: Role
    constructor(role: Role) {
        this.role = role
    }
}

@json
export class GetRoleByRoleNameRequest {
    role: string = ""
    constructor(role: string) {
        this.role = role
    }
}

@json
export class GetAddressOrRoleRequest {
    addressOrRole: string
    constructor(addressOrRole: string) {
        this.addressOrRole = addressOrRole
    }
}

@json
export class GetRoleNameByAddressRequest {
    address: string
    constructor(address: string) {
        this.address = address
    }
}

@json
export class GetRoleLabelByContractRequest {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}

@json
export class GetRoleByLabelRequest {
    label: string
    constructor(label: string) {
        this.label = label
    }
}

@json
export class GetRolesRequest {}

@json
export class MsgRunHook {
    hook: string
    data: Base64String
    constructor(hook: string, data: Base64String) {
        this.hook = hook
        this.data = data
    }
}
