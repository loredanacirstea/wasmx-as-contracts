import { JSON } from "json-as/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { DenomUnit_, DenomUnit, Params, DenomInfo } from "./types";
import { Bech32String } from "wasmx-env/assembly/types";
import { parseInt32, parseInt64 } from "wasmx-utils/assembly/utils";
import { LoggerInfo } from "./utils";

const PARAM_KEY = "params"
const BASE_DENOMS_KEY = "base_denoms"
const ADDRESS_DENOM_KEY = "address_to_denom_"
const DENOM_ADDRESS_KEY = "denom_to_address_"
const DENOMS_KEY = "denom_to_basedenom_"
const AUTHORITIES_KEY = "authorities"

export function registerDenomContract(address: Bech32String, baseDenom: string, altdenoms: DenomUnit[]): void {
    wasmxw.sstore(ADDRESS_DENOM_KEY + address, baseDenom)
    wasmxw.sstore(DENOM_ADDRESS_KEY + baseDenom, address)
    LoggerInfo(`stored denom`, ["baseDenom", baseDenom, "address", address])
    for (let i = 0; i < altdenoms.length; i++) {
        const coin = new DenomUnit_(baseDenom, i64(Math.pow(10, altdenoms[i].exponent)))
        const data = JSON.stringify<DenomUnit_>(coin)
        wasmxw.sstore(DENOMS_KEY + altdenoms[i].denom, data)
        for (let j = 0; j < altdenoms[i].aliases.length; j++) {
            wasmxw.sstore(DENOMS_KEY + altdenoms[i].aliases[j], data)
        }
    }
}

export function getDenomInfoByAnyDenom(denom: string): DenomInfo {
    let addr = getAddressByDenom(denom)
    if (addr != "") {
        return new DenomInfo(denom, 1, addr);
    }
    const unit = getDenomByAltDenom(denom)
    if (unit.denom != "") {
        addr = getAddressByDenom(unit.denom)
    }
    return new DenomInfo(unit.denom, unit.value, addr);
}

export function getDenomByAddress(addr: Bech32String): string {
    return wasmxw.sload(ADDRESS_DENOM_KEY + addr)
}

export function getAddressByDenom(denom: string): Bech32String {
    return wasmxw.sload(DENOM_ADDRESS_KEY + denom)
}

export function getDenomByAltDenom(denom: string): DenomUnit_ {
    const value = wasmxw.sload(DENOMS_KEY + denom)
    if (value == "") return new DenomUnit_("", 0);
    return JSON.parse<DenomUnit_>(value)
}

export function getBaseDenoms(): string[] {
    const value = wasmxw.sload(BASE_DENOMS_KEY);
    return JSON.parse<string[]>(value);
}

export function setBaseDenoms(value: string[]): void {
    return wasmxw.sstore(BASE_DENOMS_KEY, JSON.stringify<string[]>(value));
}


export function getParams(): Params {
    const value = wasmxw.sload(PARAM_KEY);
    return JSON.parse<Params>(value);
}

export function getParamsInternal(): string {
    return wasmxw.sload(PARAM_KEY);
}

export function setParams(params: Params): void {
    return wasmxw.sstore(PARAM_KEY, JSON.stringify<Params>(params));
}

export function getAuthorities(): string[] {
    const value = wasmxw.sload(AUTHORITIES_KEY);
    return JSON.parse<string[]>(value);
}

export function setAuthorities(value: string[]): void {
    return wasmxw.sstore(AUTHORITIES_KEY, JSON.stringify<string[]>(value));
}
