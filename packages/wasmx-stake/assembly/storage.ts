import { JSON } from "json-as/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx_wrap";
import {ValidatorInfo, Params, Validator} from "./types";
import { Bech32String } from "wasmx-env/assembly/types";
import { parseInt32, parseInt64 } from "wasmx-utils/assembly/utils";

const VALIDATOR_ADDRESSES = "validators_addresses"
const VALIDATOR_KEY = "validator_"
const PARAM_KEY = "params"

export function setNewValidator(value: Validator): void {
    const addrs = getValidatorsAddresses();
    addrs.push(value.operator_address);
    setValidatorsAddresses(addrs);
    setValidator(value);
}

export function getValidatorsAddresses(): string[] {
    const value = wasmx.sload(VALIDATOR_ADDRESSES);
    if (value === "") return [];
    return JSON.parse<string[]>(value);
}

export function setValidatorsAddresses(value: string[]): void {
    wasmx.sstore(VALIDATOR_ADDRESSES, JSON.stringify<string[]>(value));
}

export function getValidator(address: Bech32String): Validator | null {
    const value = wasmx.sload(VALIDATOR_KEY + address);
    if (value === "") return null;
    return JSON.parse<Validator>(value);
}

export function setValidator(value: Validator): void {
    const data = JSON.stringify<Validator>(value);
    wasmx.sstore(VALIDATOR_KEY + value.operator_address, data);
}

export function getParams(): Params {
    const value = wasmx.sload(PARAM_KEY);
    return JSON.parse<Params>(value);
}

export function getParamsInternal(): string {
    return wasmx.sload(PARAM_KEY);
}

export function setParams(params: Params): void {
    return wasmx.sstore(PARAM_KEY, JSON.stringify<Params>(params));
}


