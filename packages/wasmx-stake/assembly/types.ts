import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, HexString } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn"

export const MODULE_NAME = "staking"

// @ts-ignore
@serializable
export type BondStatusNumber = i32
// UNSPECIFIED defines an invalid validator status.
export const Unspecified = 0;
// UNBONDED defines a validator that is not bonded.
export const Unbonded = 1;
// UNBONDING defines a validator that is unbonding.
export const Unbonding = 2;
// BONDED defines a validator that is bonded.
export const Bonded = 3;

// @ts-ignore
@serializable
export type BondStatusString = string
// UNSPECIFIED defines an invalid validator status.
export const UnspecifiedS = "BOND_STATUS_UNSPECIFIED"; // Unspecified
// UNBONDED defines a validator that is not bonded.
export const UnbondedS = "BOND_STATUS_UNBONDED"; // Unbonded
// UNBONDING defines a validator that is unbonding.
export const UnbondingS = "BOND_STATUS_UNBONDING"; // Unbonding
// BONDED defines a validator that is bonded.
export const BondedS = "BOND_STATUS_BONDED"; // Bonded

// @ts-ignore
@serializable
export class Coin {
    denom: string
    amount: BigInt
    constructor(denom: string, amount: BigInt) {
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
export class CommissionRates {
    // rate is the commission rate charged to delegators, as a fraction.
    rate: string // f64
    // max_rate defines the maximum commission rate which validator can ever charge, as a fraction.
    max_rate: string // f64
    // max_change_rate defines the maximum daily increase of the validator commission, as a fraction.
    max_change_rate: string // f64
    constructor(rate: string, max_rate: string, max_change_rate: string) {
        this.rate = rate
        this.max_rate = max_rate
        this.max_change_rate = max_change_rate
    }
}

// @ts-ignore
@serializable
export class MsgCreateValidator {
    description: Description
    commission: CommissionRates
    min_self_delegation: BigInt // TODO Int
    // Deprecated: Use of Delegator Address in MsgCreateValidator is deprecated.
    // The validator address bytes and delegator address bytes refer to the same account while creating validator (defer
    // only in bech32 notation).
    validator_address: string
    pubkey: PublicKey
    value: Coin
    constructor(description: Description, commission: CommissionRates, min_self_delegation: BigInt, validator_address: string, pubkey: PublicKey, value: Coin) {
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

// @ts-ignore
@serializable
export class ValidatorInfo {
    address: HexString
    pub_key: Base64String // crypto.PubKey
    voting_power: i64
    proposer_priority: i64
    constructor(address: HexString, pub_key: string, voting_power: i64, proposer_priority: i64) {
        this.address = address;
        this.pub_key = pub_key;
        this.voting_power = voting_power;
        this.proposer_priority = proposer_priority;
    }
}

// @ts-ignore
@serializable
export class Delegation {
    delegator_address: Bech32String
    validator_address: Bech32String
    amount: BigInt
    constructor(delegator_address: Bech32String, validator_address: Bech32String, amount: BigInt) {
        this.delegator_address = delegator_address
        this.validator_address = validator_address
        this.amount = amount
    }
}

// @ts-ignore
@serializable
export class LastValidatorPower {
    // address is the address of the validator.
    address: string
    // power defines the power of the validator.
    power: i64
    constructor(address: string, power: i64) {
        this.address = address
        this.power = power
    }
}

// @ts-ignore
@serializable
export class UnbondingDelegationEntry {
    // creation_height is the height which the unbonding took place.
    creation_height: i64
    // completion_time is the unix time for unbonding completion.
    completion_time: i64
    // initial_balance defines the tokens initially scheduled to receive at completion.
    initial_balance: BigInt
    // balance defines the tokens to receive at completion.
    balance: BigInt
    // Incrementing id that uniquely identifies this entry
    unbonding_id: u64
    // Strictly positive if this entry's unbonding has been stopped by external modules
    unbonding_on_hold_ref_count: i64
    constructor(creation_height: i64, completion_time: i64, initial_balance: BigInt, balance: BigInt, unbonding_id: u64, unbonding_on_hold_ref_count: i64) {
        this.creation_height = creation_height
        this.completion_time = completion_time
        this.initial_balance = initial_balance
        this.balance = balance
        this.unbonding_id = unbonding_id
        this.unbonding_on_hold_ref_count = unbonding_on_hold_ref_count
    }
}

// @ts-ignore
@serializable
export class UnbondingDelegation {
    // delegator_address is the encoded address of the delegator.
    delegator_address: string
    // validator_address is the encoded address of the validator.
    validator_address: string
    // entries are the unbonding delegation entries.
    entries: UnbondingDelegationEntry[]
    constructor(delegator_address: string, validator_address: string,  entries: UnbondingDelegationEntry[]) {
        this.delegator_address = delegator_address
        this.validator_address = validator_address
        this.entries = entries
    }
}

// @ts-ignore
@serializable
export class RedelegationEntry {}

// Redelegation contains the list of a particular delegator's redelegating bonds
// from a particular source validator to a particular destination validator.
// @ts-ignore
@serializable
export class Redelegation {
	// delegator_address is the bech32-encoded address of the delegator.
	delegator_address: string
	// validator_src_address is the validator redelegation source operator address.
	validator_src_address: string
	// validator_dst_address is the validator redelegation destination operator address.
	validator_dst_address: string
	// entries are the redelegation entries.
	entries: RedelegationEntry[]
    constructor(delegator_address: string, validator_src_address: string, validator_dst_address: string, entries: RedelegationEntry[]) {
        this.delegator_address = delegator_address
        this.validator_src_address = validator_src_address
        this.validator_dst_address = validator_dst_address
        this.entries = entries
    }
}

// @ts-ignore
@serializable
export class MsgInitGenesis {
    // params defines all the parameters of related to deposit.
    params: Params
    // last_total_power tracks the total amounts of bonded tokens recorded during
    // the previous end block.
    last_total_power: i64
    // last_validator_powers is a special index that provides a historical list
    // of the last-block's bonded validators.
    last_validator_powers: LastValidatorPower[]
    // validators defines the validator set at genesis.
    validators: Validator[]
    // delegations defines the delegations active at genesis.
    delegations: Delegation[]
    // unbonding_delegations defines the unbonding delegations active at genesis.
    unbonding_delegations: UnbondingDelegation[]
    // redelegations defines the redelegations active at genesis.
    redelegations: Redelegation[]
    // exported defines a bool to identify whether the chain dealing with exported or initialized genesis.
    // exported: bool
    constructor(params: Params, last_total_power: i64, last_validator_powers: LastValidatorPower[], validators: Validator[], delegations: Delegation[],  unbonding_delegations: UnbondingDelegation[], redelegations: Redelegation[]) {
        this.params = params
        this.last_total_power = last_total_power
        this.last_validator_powers = last_validator_powers
        this.validators = validators
        this.delegations = delegations
        this.unbonding_delegations = unbonding_delegations
        this.redelegations = redelegations
        // this.exported = exported
    }
}

// @ts-ignore
@serializable
export class InitGenesisResponse {
    updates: ValidatorUpdate[]
    constructor(updates: ValidatorUpdate[]) {
        this.updates = updates
    }
}

// @ts-ignore
@serializable
export class Params {
	// unbonding_time is the time duration of unbonding.
	unbonding_time: i64
	// max_validators is the maximum number of validators.
	max_validators: u32
	// max_entries is the max entries for either unbonding delegation or redelegation (per pair/trio).
	max_entries: u32
	// historical_entries is the number of historical entries to persist.
	historical_entries: u32
	// bond_denom defines the bondable coin denomination.
	bond_denom: string
	// min_commission_rate is the chain-wide minimum commission rate that a validator can charge their delegators
	min_commission_rate: f64
    constructor(unbonding_time: i64, max_validators: u32, max_entries: u32, historical_entries: u32, bond_denom: string, min_commission_rate: f64) {
        this.unbonding_time = unbonding_time
        this.max_validators = max_validators
        this.max_entries = max_entries
        this.historical_entries = historical_entries
        this.bond_denom = bond_denom
        this.min_commission_rate = min_commission_rate
    }
}

// @ts-ignore
@serializable
export class Commission {
    // commission_rates defines the initial commission rates to be used for creating a validator.
    commission_rates: CommissionRates
    // update_time is the last time the commission rate was changed.
    update_time: Date // Date
    constructor(commission_rates: CommissionRates, update_time: Date) {
        this.commission_rates = commission_rates
        this.update_time = update_time
    }
}


// @ts-ignore
@serializable
export class PublicKey {
    anytype: string
    key: Base64String
    constructor(type: string, key: Base64String) {
        this.anytype = type;
        this.key = key
    }
}

// @ts-ignore
@serializable
export class Validator {
	// operator_address defines the address of the validator's operator; bech encoded in JSON.
	operator_address: Bech32String
	// consensus_pubkey is the consensus public key of the validator, as a Protobuf Any.
	consensus_pubkey: PublicKey
	// jailed defined whether the validator has been jailed from bonded status or not.
	jailed: bool
	// status is the validator status (bonded/unbonding/unbonded).
	status: BondStatusString
	// tokens define the delegated tokens (incl. self-delegation).
    // !not used in staking
	tokens: BigInt
	// delegator_shares defines total shares issued to a validator's delegators.
	delegator_shares: string // f64
	// description defines the description terms for the validator.
	description: Description
	// unbonding_height defines, if unbonding, the height at which this validator has begun unbonding.
	unbonding_height: i64
	// unbonding_time defines, if unbonding, the min time for the validator to complete unbonding.
	unbonding_time: Date
	// commission defines the commission parameters.
	commission: Commission
	// min_self_delegation is the validator's self declared minimum self delegation.
	// Since: cosmos-sdk 0.46
	min_self_delegation: BigInt
	// strictly positive if this validator's unbonding has been stopped by external modules
	unbonding_on_hold_ref_count: i64
	// list of unbonding ids, each uniquely identifing an unbonding of this validator
	unbonding_ids: u64[]
    constructor(operator_address: string, consensus_pubkey: PublicKey, jailed: bool, status: BondStatusString, tokens: BigInt, delegator_shares: string, description: Description, unbonding_height: i64, unbonding_time: Date, commission: Commission, min_self_delegation: BigInt, unbonding_on_hold_ref_count: i64, unbonding_ids: u64[]) {
        this.operator_address = operator_address
        this.consensus_pubkey = consensus_pubkey
        this.jailed = jailed
        this.status = status
        this.tokens = tokens
        this.delegator_shares = delegator_shares
        this.description = description
        this.unbonding_height = unbonding_height
        this.unbonding_time = unbonding_time
        this.commission = commission
        this.min_self_delegation = min_self_delegation
        this.unbonding_on_hold_ref_count = unbonding_on_hold_ref_count
        this.unbonding_ids = unbonding_ids
    }
}

// @ts-ignore
@serializable
export class MsgDelegate {
    delegator_address: string
    validator_address: string
    amount: Coin
    constructor(delegator_address: string, validator_address: string, amount: Coin) {
        this.delegator_address = delegator_address
        this.validator_address = validator_address
        this.amount = amount
    }
}

// @ts-ignore
@serializable
export class ValidatorUpdate {
    pub_key: PublicKey
    power:  i64
    constructor(pub_key: PublicKey, power:  i64) {
        this.pub_key = pub_key;
        this.power = power;
    }
}

// @ts-ignore
@serializable
export class MsgGetAllValidators {}

// @ts-ignore
@serializable
export class MsgUpdateValidators {
    updates: ValidatorUpdate[]
    constructor(updates: ValidatorUpdate[]) {
        this.updates = updates
    }
}

// @ts-ignore
@serializable
export class QueryValidatorsResponse {
    validators: Validator[]
    constructor(validators: Validator[]) {
        this.validators = validators
    }
}

// @ts-ignore
@serializable
export class QueryValidatorRequest {
    validator_addr: Bech32String
    constructor(validator_addr: Bech32String) {
        this.validator_addr = validator_addr
    }
}

// @ts-ignore
@serializable
export class QueryValidatorResponse {
    validator: Validator
    constructor(validator: Validator) {
        this.validator = validator
    }
}

// @ts-ignore
@serializable
export class QueryDelegationRequest {
    delegator_addr: Bech32String
    validator_addr: Bech32String
    constructor(delegator_addr: Bech32String, validator_addr: Bech32String) {
        this.delegator_addr = delegator_addr
        this.validator_addr = validator_addr
    }
}

// @ts-ignore
@serializable
export class DelegationCosmos {
    delegator_address: Bech32String
    validator_address: Bech32String
    shares: BigInt
    constructor(delegator_address: Bech32String, validator_address: Bech32String, shares: BigInt) {
        this.delegator_address = delegator_address
        this.validator_address = validator_address
        this.shares = shares
    }
}

// @ts-ignore
@serializable
export class DelegationResponse {
    delegation: DelegationCosmos
    balance: Coin
    constructor(delegation: DelegationCosmos, balance: Coin) {
        this.delegation = delegation
        this.balance = balance
    }
}

// @ts-ignore
@serializable
export class QueryDelegationResponse {
    delegation_response: DelegationResponse
    constructor(delegation_response: DelegationResponse) {
        this.delegation_response = delegation_response
    }
}
