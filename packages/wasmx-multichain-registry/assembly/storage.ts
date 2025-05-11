import { JSON } from "json-as";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { revert } from "./utils";
import { DEFAULT_DERC20_CODE_ID, DEFAULT_EID_CHECK, DEFAULT_ERC20_CODE_ID, DEFAULT_INITIAL_BALANCE, DEFAULT_MIN_VALIDATORS_COUNT, Params, SubChainData } from "./types";
import { BigInt } from "wasmx-env/assembly/bn";

export const SPLIT = "."
export const PARAMS_KEY = "params"
export const CHAIN_IDS = "chainids"
export const CHAIN_VALIDATORS = "chain_validators."
export const CHAIN_VALIDATOR_ADDRESSES = "chain_validatoraddresses."
export const DATA_KEY = "chain_data."
export const VALIDATOR_CHAINS = "validator_chains."
export const LEVEL_LAST = "level_last"
export const LEVEL_CHAIN_IDS = "level_chainids."
export const CURRENT_LEVEL = "currentlevel"
export const LAST_CHAIN_ID = "chainid_last"

export const INITIAL_LEVEL = 1

// chain_id => chain data
export function getDataKey(chainId: string): string {
    return DATA_KEY + chainId
}

// chain_id => validators
export function getValidatorsKey(chainId: string): string {
    return CHAIN_VALIDATORS + chainId
}

// chain_id => validatorsAddresses
export function getValidatorAddressesKey(chainId: string): string {
    return CHAIN_VALIDATOR_ADDRESSES + chainId
}

// validatorAddress => chain_id[]
export function getValidatorChainIdsKey(validatorAddress: string): string {
    return VALIDATOR_CHAINS + validatorAddress
}

// levelIndex => chain_id[]
export function getLevelChainIdsKey(levelIndex: i32): string {
    return LEVEL_CHAIN_IDS + levelIndex.toString()
}

export function getValidatorChains(validatorAddress: string): string[] {
    const value = wasmxw.sload(getValidatorChainIdsKey(validatorAddress));
    if (value == "") return [];
    return JSON.parse<string[]>(value);
}

export function addValidatorChain(validatorAddress: string, chainId: string): void {
    const chainIds = getValidatorChains(validatorAddress)
    if (!chainIds.includes(chainId)) {
        chainIds.push(chainId);
        setValidatorChains(validatorAddress, chainIds);
    }
}

export function setValidatorChains(validatorAddress: string, chainIds: string[]): void {
    const data = JSON.stringify<string[]>(chainIds)
    wasmxw.sstore(getValidatorChainIdsKey(validatorAddress), data);
}

export function getChainData(chainId: string): SubChainData | null {
    const value = wasmxw.sload(getDataKey(chainId));
    if (value == "") return null;
    return JSON.parse<SubChainData>(value);
}

export function setChainData(data: SubChainData): void {
    const chainId = data.data.init_chain_request.chain_id
    const datastr = JSON.stringify<SubChainData>(data);
    wasmxw.sstore(getDataKey(chainId), datastr);
}

export function addChainValidator(chainId: string, validatorAddress: Bech32String, genTx: Base64String): void {
    addChainValidatorAddress(chainId, validatorAddress);
    const value = getChainValidators(chainId)
    value.push(genTx)
    setChainValidators(chainId, value)
}

export function getChainValidators(chainId: string): Base64String[] {
    const value = wasmxw.sload(getValidatorsKey(chainId));
    if (value == "") return [];
    return JSON.parse<Base64String[]>(value);
}

export function setChainValidators(chainId: string, genTxs: Base64String[]): void {
    return wasmxw.sstore(getValidatorsKey(chainId), JSON.stringify<Base64String[]>(genTxs));
}

export function addChainValidatorAddress(chainId: string, addr: Bech32String): void {
    const value = getChainValidatorAddresses(chainId)
    if (value.includes(addr)) {
        revert(`validator address already included: ${addr}`)
    }
    value.push(addr)
    setChainValidatorAddresses(chainId, value)
}

export function getChainValidatorAddresses(chainId: string): Bech32String[] {
    const value = wasmxw.sload(getValidatorAddressesKey(chainId));
    if (value == "") return [];
    return JSON.parse<Bech32String[]>(value);
}

export function setChainValidatorAddresses(chainId: string, addrs: Bech32String[]): void {
    return wasmxw.sstore(getValidatorAddressesKey(chainId), JSON.stringify<Bech32String[]>(addrs));
}

export function getLevelChainIds(levelIndex: i32): string[] {
    const value = wasmxw.sload(getLevelChainIdsKey(levelIndex));
    if (value == "") return [];
    return JSON.parse<string[]>(value);
}

export function addLevelChainId(levelIndex: i32, chainId: string): void {
    const value = getLevelChainIds(levelIndex)
    if (value.includes(chainId)) {
        revert(`chain_id ${chainId} already included in level ${levelIndex}`)
    }
    value.push(chainId)
    setLevelChainIds(levelIndex, value)
    const lastLevel = getLevelLast()
    if (lastLevel < levelIndex) {
        setLevelLast(levelIndex)
    }
}

export function setLevelChainIds(levelIndex: i32, chainIds: string[]): void {
    return wasmxw.sstore(getLevelChainIdsKey(levelIndex), JSON.stringify<string[]>(chainIds));
}

export function addChainId(data: string): void {
    const ids = getChainIds()
    if (ids.includes(data)) {
        return
    }
    ids.push(data)
    return wasmxw.sstore(CHAIN_IDS, JSON.stringify<string[]>(ids));
}

export function getChainIds(): string[] {
    const value = wasmxw.sload(CHAIN_IDS);
    if (value == "") return [];
    return JSON.parse<string[]>(value);
}

export function setChainIds(data: string[]): void {
    return wasmxw.sstore(CHAIN_IDS, JSON.stringify<string[]>(data));
}

export function getLevelLast(): i32 {
    const valuestr = wasmxw.sload(LEVEL_LAST);
    if (valuestr == "") return INITIAL_LEVEL;
    const value = parseInt(valuestr);
    return i32(value);
}

export function setLevelLast(id: i32): void {
    return wasmxw.sstore(LEVEL_LAST, id.toString());
}

export function getCurrentLevel(): i32 {
    const valuestr = wasmxw.sload(CURRENT_LEVEL);
    if (valuestr == "") return 0;
    const value = parseInt(valuestr);
    return i32(value);
}

export function setCurrentLevel(level: i32): void {
    return wasmxw.sstore(CURRENT_LEVEL, level.toString());
}

export function getChainIdLast(): u64 {
    const valuestr = wasmxw.sload(LAST_CHAIN_ID);
    if (valuestr == "") return 0;
    const value = parseInt(valuestr);
    return u64(value);
}

export function setChainIdLast(id: u64): void {
    return wasmxw.sstore(LAST_CHAIN_ID, id.toString());
}

export function getParams(): Params {
    const value = wasmxw.sload(PARAMS_KEY);
    if (value == "") return new Params(DEFAULT_MIN_VALIDATORS_COUNT, DEFAULT_EID_CHECK, DEFAULT_ERC20_CODE_ID, DEFAULT_DERC20_CODE_ID, BigInt.fromString(DEFAULT_INITIAL_BALANCE));
    return JSON.parse<Params>(value);
}

export function setParams(data: Params): void {
    return wasmxw.sstore(PARAMS_KEY, JSON.stringify<Params>(data));
}
