import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, Coin, HexString } from 'wasmx-env/assembly/types';

// @ts-ignore
@serializable
export class CallDataInstantiate {
    admin: Base64String
    minter: Base64String
    name: string
    symbol: string
    decimals: i32
    constructor(admin: Base64String, minter: Base64String, name: string, symbol: string,  decimals: i32) {
        this.admin = admin
        this.minter = minter
        this.name = name
        this.symbol = symbol
        this.decimals = decimals
    }
}

// @ts-ignore
@serializable
export class MsgDelegate {
    delegator: Bech32String
    validator: Bech32String
    value: i64
    constructor(delegator: Bech32String, validator: Bech32String, value: i64) {
        this.delegator = delegator
        this.validator = validator
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgRedelegate {
    delegator: Bech32String
    validatorSource: Bech32String
    validatorDestination: Bech32String
    value: i64
    constructor(delegator: Bech32String, validatorSource: Bech32String, validatorDestination: Bech32String, value: i64) {
        this.delegator = delegator
        this.validatorSource = validatorSource
        this.validatorDestination = validatorDestination
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgUndelegate {
    delegator: Bech32String
    validator: Bech32String
    value: i64
    constructor(delegator: Bech32String, validator: Bech32String, value: i64) {
        this.delegator = delegator
        this.validator = validator
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgGetAllSDKDelegations {}

// @ts-ignore
@serializable
export class MsgGetAllSDKDelegationsResponse {
    delegations: SDKDelegations[]
    constructor(delegations: SDKDelegations[]) {
        this.delegations = delegations
    }
}

// @ts-ignore
@serializable
export class SDKDelegations {
    delegator_address: Bech32String
    validator_address: Bech32String
    shares: string
    constructor(delegator_address: Bech32String, validator_address: Bech32String, shares: string) {
        this.delegator_address = delegator_address
        this.validator_address = validator_address
        this.shares = shares
    }
}
