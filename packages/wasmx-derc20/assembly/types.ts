import { JSON } from "json-as";
import { Base64String, Bech32String, Coin, HexString, PageResponse } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn";

export const MODULE_NAME = "derc20"

@json
export class MsgDelegate {
    delegator: Bech32String
    validator: Bech32String
    value: BigInt
    constructor(delegator: Bech32String, validator: Bech32String, value: BigInt) {
        this.delegator = delegator
        this.validator = validator
        this.value = value
    }
}

@json
export class MsgRedelegate {
    delegator: Bech32String
    validatorSource: Bech32String
    validatorDestination: Bech32String
    value: BigInt
    constructor(delegator: Bech32String, validatorSource: Bech32String, validatorDestination: Bech32String, value: BigInt) {
        this.delegator = delegator
        this.validatorSource = validatorSource
        this.validatorDestination = validatorDestination
        this.value = value
    }
}

@json
export class MsgUndelegate {
    delegator: Bech32String
    validator: Bech32String
    value: BigInt
    constructor(delegator: Bech32String, validator: Bech32String, value: BigInt) {
        this.delegator = delegator
        this.validator = validator
        this.value = value
    }
}

@json
export class MsgGetAllSDKDelegations {}

@json
export class MsgGetAllSDKDelegationsResponse {
    delegations: SDKDelegation[]
    constructor(delegations: SDKDelegation[]) {
        this.delegations = delegations
    }
}

@json
export class SDKDelegation {
    delegator_address: Bech32String
    validator_address: Bech32String
    shares: BigInt
    constructor(delegator_address: Bech32String, validator_address: Bech32String, shares: BigInt) {
        this.delegator_address = delegator_address
        this.validator_address = validator_address
        this.shares = shares
    }
}

@json
export class DelegatorValidatorsResponse {
    validators: Bech32String[]
    pagination: PageResponse
    constructor(validators: Bech32String[], pagination: PageResponse) {
        this.validators = validators
        this.pagination = pagination
    }
}
