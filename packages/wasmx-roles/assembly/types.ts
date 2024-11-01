import { JSON } from "json-as/assembly";
import { Bech32String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "roles"

// @ts-ignore
@serializable
export class Role {
    role: string
    label: string
    contract_address: string
    constructor(
        role: string,
        label: string,
        contract_address: string,
    ) {
        this.role = role
        this.label = label
        this.contract_address = contract_address
    }
}

// @ts-ignore
@serializable
export class CallDataInstantiate {
    roles: Role[]
    constructor(roles: Role[]) {
        this.roles = roles
    }
}

// @ts-ignore
@serializable
export class RegisterRoleRequest {
    role: string
    label: string
    contract_address: string
    constructor(
        role: string,
        label: string,
        contract_address: string,
    ) {
        this.role = role
        this.label = label
        this.contract_address = contract_address
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
