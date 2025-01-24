import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, Role, RoleChanged } from "wasmx-env/assembly/types";

export const MODULE_NAME = "roles"

export const AttributeKeyRoleMultipleLabels = "multiple_labels";
export const AttributeKeyRoleStorageType = "storage_type";

// for authorization purposes, when the old contract is replaced for a role in EndBlock
// the old contract may need to still perform actions even after EndBlock (e.g. consensus contract needs to call Commit) and it needs authorization, so for now, we just assign a previous role
export var ROLE_PREVIOUS = "previous_"

// @ts-ignore
@serializable
export class RolesChangedHook {
    role: Role | null
    role_changed: RoleChanged | null
    constructor(role: Role | null, role_changed: RoleChanged | null) {
        this.role = role
        this.role_changed = role_changed
    }
}

// @ts-ignore
@serializable
export class SetRoleRequest {
    role: Role
    constructor(role: Role) {
        this.role = role
    }
}

// @ts-ignore
@serializable
export class GetRoleByRoleNameRequest {
    role: string = ""
    constructor(role: string) {
        this.role = role
    }
}

// @ts-ignore
@serializable
export class GetAddressOrRoleRequest {
    addressOrRole: string
    constructor(addressOrRole: string) {
        this.addressOrRole = addressOrRole
    }
}

// @ts-ignore
@serializable
export class GetRoleNameByAddressRequest {
    address: string
    constructor(address: string) {
        this.address = address
    }
}

// @ts-ignore
@serializable
export class GetRoleLabelByContractRequest {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}

// @ts-ignore
@serializable
export class GetRoleByLabelRequest {
    label: string
    constructor(label: string) {
        this.label = label
    }
}

// @ts-ignore
@serializable
export class GetRolesRequest {}

// @ts-ignore
@serializable
export class MsgRunHook {
    hook: string
    data: Base64String
    constructor(hook: string, data: Base64String) {
        this.hook = hook
        this.data = data
    }
}
