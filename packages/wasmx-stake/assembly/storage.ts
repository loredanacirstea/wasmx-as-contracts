import { JSON } from "json-as/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx_wrap";
import {ValidatorInfo, Params, Validator} from "./types";
import { Bech32String, HexString, ValidatorAddressString } from "wasmx-env/assembly/types";
import { decode as decodeBase64 } from "as-base64/assembly";
import { uint8ArrayToHex } from "../../as-tally/assembly/tally";

const VALIDATOR_ADDRESSES = "validators_addresses"
const VALIDATOR_KEY = "validator_"
const VALIDATOR_CONSADDR_TO_OPERATOR_KEY = "validatorconsaddrtooperator_"
const VALIDATOR_OPERATOR_TO_CONSADDR_KEY = "validatoroperatortoconsaddr_"
const VALIDATOR_HEXADDR_TO_OPERATOR_KEY = "validatorhexaddrtooperator_"
const PARAM_KEY = "params"
const BASE_DENOM_KEY = "base_denom"

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
    const consaddr = wasmx.addr_humanize(decodeBase64(value.consensus_pubkey.key).buffer)
    const hexaddr = wasmx.ed25519PubToHex(value.consensus_pubkey.key)
    setValidatorAddrByConsAddr(value.operator_address, consaddr)
    setValidatorConsAddrByOperator(value.operator_address, consaddr)
    setValidatorOperatorByHexAddr(hexaddr, value.operator_address);
}

export function getValidatorOperatorByHexAddr(hexaddr: HexString): string {
    return wasmx.sload(VALIDATOR_HEXADDR_TO_OPERATOR_KEY + hexaddr);
}

export function setValidatorOperatorByHexAddr(hexaddr: HexString, operator: Bech32String): void {
    wasmx.sstore(VALIDATOR_HEXADDR_TO_OPERATOR_KEY + hexaddr, operator);
}

export function getValidatorConsAddrByOperator(addr: Bech32String): string {
    return wasmx.sload(VALIDATOR_OPERATOR_TO_CONSADDR_KEY + addr);
}

export function setValidatorConsAddrByOperator(addr: Bech32String, consaddr: ValidatorAddressString): void {
    wasmx.sstore(VALIDATOR_OPERATOR_TO_CONSADDR_KEY + addr, consaddr);
}

export function getValidatorAddrByConsAddr(consaddr: ValidatorAddressString): string {
    return wasmx.sload(VALIDATOR_CONSADDR_TO_OPERATOR_KEY + consaddr);
}

export function setValidatorAddrByConsAddr(addr: Bech32String, consaddr: Bech32String): void {
    wasmx.sstore(VALIDATOR_CONSADDR_TO_OPERATOR_KEY + consaddr, addr);
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

export function getBaseDenom(): string {
    return wasmx.sload(BASE_DENOM_KEY);
}

export function setBaseDenom(value: string): void {
    return wasmx.sstore(BASE_DENOM_KEY, value);
}
