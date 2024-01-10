import { JSON } from "json-as/assembly";
import { Base64String } from 'wasmx-env/assembly/types';

// @ts-ignore
@serializable
export class Coin {
    denom: string
    amount: i64 // TODO Int, at least u128
    constructor(denom: string, amount: i64) {
        this.denom = denom
        this.amount = amount
    }
}

// @ts-ignore
@serializable
export class Description {
    // moniker defines a human-readable name for the validator.
    moniker: string
    // identity defines an optional identity signature (ex. UPort or Keybase).
    identity: string
    // website defines an optional website link.
    website: string
    // security_contact defines an optional email for security contact.
    security_contact: string
    // details define other optional details.
    details: string
    constructor(moniker: string, identity: string, website: string, security_contact: string, details: string) {
        this.moniker = moniker;
        this.identity = identity;
        this.website = website;
        this.security_contact = security_contact;
        this.details = details;
    }
}


// @ts-ignore
@serializable
export class LegacyDec {

}

// @ts-ignore
@serializable
export class CommissionRates {
    // rate is the commission rate charged to delegators, as a fraction.
    rate: LegacyDec
    // max_rate defines the maximum commission rate which validator can ever charge, as a fraction.
    max_rate: LegacyDec
    // max_change_rate defines the maximum daily increase of the validator commission, as a fraction.
    max_change_rate: LegacyDec
    constructor(rate: string, max_rate: string, max_change_rate: string) {
        this.rate = rate;
        this.max_rate = max_rate;
        this.max_change_rate = max_change_rate;
    }
}

// @ts-ignore
@serializable
export class MsgCreateValidator {
    description: Description
    commission: CommissionRates
    min_self_delegation: i64 // TODO Int
    // Deprecated: Use of Delegator Address in MsgCreateValidator is deprecated.
    // The validator address bytes and delegator address bytes refer to the same account while creating validator (defer
    // only in bech32 notation).
    validator_address: string
    pubkey: Base64String
    value: Coin
    constructor(description: Description, commission: CommissionRates, min_self_delegation: i64, validator_address: string, pubkey: Base64String, value: Coin) {
        this.description = description
        this.commission = commission
        this.min_self_delegation = min_self_delegation
        this.validator_address = validator_address
        this.pubkey = pubkey
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgCreateValidatorResponse {}

