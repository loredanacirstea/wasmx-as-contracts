import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Bech32String } from 'wasmx-env/assembly/types';
import { parseInt32, parseInt64 } from "wasmx-utils/assembly/utils";
import { BigInt } from "wasmx-env/assembly/bn";

// delegator => validators[]
export const DELEGATOR_TO_VALIDATORS_KEY = "delegator_to_validators."
// delegator => validator => amount
export const DELEGATOR_TO_DELEGATION_KEY = "delegator_to_delegation."
// validator => delegator[]
export const VALIDATOR_TO_DELEGATORS_KEY = "validator_to_delegators."
// validator => total delegation
export const VALIDATOR_DELEGATION_KEY = "validator_delegation."

// validator total delegated amounts
export const BALANCE_VALID_KEY = "balance_validator_"

export function getBalanceValidatorKey(addr: string): string {
    return BALANCE_VALID_KEY + addr;
}

const BASE_DENOM_KEY = "base_denom"

// delegator => validators[]
export function getDelegatorToValidatorsKey(delegator: Bech32String): string {
    return DELEGATOR_TO_VALIDATORS_KEY + delegator;
}

// delegator => validator => amount
export function getDelegatorToValidatorDelegationKey(delegator: Bech32String, validator: Bech32String): string {
    return DELEGATOR_TO_DELEGATION_KEY + delegator + "." + validator;
}

// validator => delegator[]
export function getValidatorToDelegatorsKey(validator: Bech32String): string {
    return VALIDATOR_TO_DELEGATORS_KEY + validator;
}

// validator => total delegation
export function getValidatorToTotalDelegationKey(validator: Bech32String): string {
    return VALIDATOR_DELEGATION_KEY + validator;
}

export function getBalanceValidator(
    addr: string,
): BigInt {
    const key = getBalanceValidatorKey(addr);
    const value = wasmxw.sload(key);
    if (value == "") return BigInt.zero();
    return BigInt.fromString(value)
}

export function setBalanceValidator(
    addr: string,
    amount: BigInt,
): void {
    const key = getBalanceValidatorKey(addr);
    wasmxw.sstore(key, amount.toString());
}

// delegator => validators[] GET
export function getDelegatorToValidators(delegator: Bech32String): Bech32String[] {
    const value = wasmxw.sload(getDelegatorToValidatorsKey(delegator))
    if (value == "") return []
    return JSON.parse<Bech32String[]>(value)
}

// delegator => validators[] SET
export function setDelegatorToValidators(delegator: Bech32String, validators: Bech32String[]): void {
    wasmxw.sstore(getDelegatorToValidatorsKey(delegator), JSON.stringify<Bech32String[]>(validators));
}

// delegator => validators[] ADD
export function addValidatorToDelegator(delegator: Bech32String, validator: Bech32String): void {
    const validators = getDelegatorToValidators(delegator)
    if (validators.includes(validator)) return;
    validators.push(validator);
    setDelegatorToValidators(delegator, validators);
}

// delegator => validators[] REMOVE
export function removeValidatorFromDelegator(delegator: Bech32String, validator: Bech32String): void {
    let validators = getDelegatorToValidators(delegator)
    let ndx = -1;
    for (let i = 0; i < validators.length; i++) {
        if (validators[i] == validator) {
            ndx = i;
        }
    }
    if (ndx == -1) return;
    validators.splice(ndx, 1);
    setDelegatorToValidators(delegator, validators);
}

// delegator => validator => amount GET
export function getDelegatorToValidatorDelegation(delegator: Bech32String, validator: Bech32String): BigInt {
    const value = wasmxw.sload(getDelegatorToValidatorDelegationKey(delegator, validator))
    if (value == "") return BigInt.zero();
    return BigInt.fromString(value)
}

// delegator => validator => amount SET
export function setDelegatorToValidatorDelegation(delegator: Bech32String, validator: Bech32String, amount: BigInt): void {
    wasmxw.sstore(getDelegatorToValidatorDelegationKey(delegator, validator), amount.toString())
}

// delegator => validator => amount REMOVE
export function removeValidatorDelegationFromDelegator(delegator: Bech32String, validator: Bech32String, amount: BigInt): void {
    // @ts-ignore
    const total = getDelegatorToValidatorDelegation(delegator, validator) - amount;
    wasmxw.sstore(getDelegatorToValidatorDelegationKey(delegator, validator), total.toString())
}

// validator => delegator[] GET
export function getValidatorToDelegators(validator: Bech32String): Bech32String[] {
    const value = wasmxw.sload(getValidatorToDelegatorsKey(validator))
    if (value == "") return []
    return JSON.parse<Bech32String[]>(value)
}

// validator => delegator[] SET
export function setValidatorToDelegators(validator: Bech32String, delegators: Bech32String[]): void {
    wasmxw.sstore(getValidatorToDelegatorsKey(validator), JSON.stringify<Bech32String[]>(delegators));
}

// validator => delegator[] ADD
export function addDelegatorToValidator(validator: Bech32String, delegator: Bech32String): void {
    const delegators = getValidatorToDelegators(validator)
    if (delegators.includes(delegator)) return;
    delegators.push(delegator);
    setValidatorToDelegators(validator, delegators);
}

// validator => delegator[] REMOVE
export function removeDelegatorFromValidator(validator: Bech32String, delegator: Bech32String): void {
    let delegators = getValidatorToDelegators(validator)
    let ndx = -1;
    for (let i = 0; i < delegators.length; i++) {
        if (delegators[i] == delegator) {
            ndx = i;
        }
    }
    if (ndx == -1) return;
    delegators.splice(ndx, 1);
    setValidatorToDelegators(validator, delegators);
}

// validator => total delegation GET
export function getValidatorToTotalDelegation(validator: Bech32String): BigInt {
    const value = wasmxw.sload(getValidatorToTotalDelegationKey(validator))
    if (value == "") return BigInt.zero();
    return BigInt.fromString(value);
}

// validator => total delegation SET
export function setValidatorToTotalDelegation(validator: Bech32String, value: BigInt): void {
    wasmxw.sstore(getValidatorToTotalDelegationKey(validator), value.toString())
}

// validator => total delegation ADD
export function addTotalDelegationToValidator(validator: Bech32String, value: BigInt): void {
    // @ts-ignore
    const total = getValidatorToTotalDelegation(validator) + value
    wasmxw.sstore(getValidatorToTotalDelegationKey(validator), total.toString())
}

// validator => total delegation REMOVE
export function removeDelegationAmountFromValidator(validator: Bech32String, value: BigInt): void {
    // @ts-ignore
    const total = getValidatorToTotalDelegation(validator) - value
    wasmxw.sstore(getValidatorToTotalDelegationKey(validator), total.toString())
}

export function getBaseDenom(): string {
    return wasmxw.sload(BASE_DENOM_KEY);
}

export function setBaseDenom(value: string): void {
    return wasmxw.sstore(BASE_DENOM_KEY, value);
}
