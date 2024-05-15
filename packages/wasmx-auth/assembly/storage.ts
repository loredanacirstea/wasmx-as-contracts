import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { BaseAccount, BaseAccountTypeName, ModuleAccount, ModuleAccountTypeName, Params } from "./types";
import { parseInt64, base64ToString, stringToBase64 } from "wasmx-utils/assembly/utils";
import { Bech32String } from "wasmx-env/assembly/types";
import { LoggerDebug } from "./utils";
import { AnyWrap } from "wasmx-env/assembly/wasmx_types";

export const SPLIT = "."
export const PARAM_KEY = "params"
export const ACC_ID_LAST_KEY = "account_id_last"
export const ACC_BY_ADDR_KEY = "account."
export const ACC_BY_ID_KEY = "account_addr."
export const TYPEURL_BASE_KEY = "typeurl_base"
export const TYPEURL_MODULE_KEY = "typeurl_module"

export function setAccount(value: AnyWrap): void {
    const data = base64ToString(value.value)
    if (value.type_url.includes(BaseAccountTypeName)) {
        const decoded = JSON.parse<BaseAccount>(data)
        let id = decoded.account_number
        if (id == 0) {
            id = addAccountAddrById(decoded.address)
            decoded.account_number = id
        }
        value.value = stringToBase64(JSON.stringify<BaseAccount>(decoded))
        setAccountAddrById(id, decoded.address);
        setAccountByAddr(decoded.address, value);
        LoggerDebug("set BaseAccount", ["address", decoded.address, "account_number", id.toString(), "sequence", decoded.sequence.toString()])
    } else if (value.type_url.includes(ModuleAccountTypeName)) {
        const decoded = JSON.parse<ModuleAccount>(data)
        let id = decoded.base_account.account_number
        if (id == 0) {
            id = addAccountAddrById(decoded.base_account.address)
            decoded.base_account.account_number = id
        }
        value.value = stringToBase64(JSON.stringify<ModuleAccount>(decoded))
        setAccountAddrById(id, decoded.base_account.address);
        setAccountByAddr(decoded.base_account.address, value);
        LoggerDebug("set ModuleAccount", ["address", decoded.base_account.address, "account_number", id.toString(), "sequence", decoded.base_account.sequence.toString()])
    }
}

// id -> addr ADD
export function addAccountAddrById(addr: Bech32String): i64 {
    const id = getAccIdLast() + 1;
    setAccountAddrById(id, addr)
    setAccIdLast(id);
    return id;
}

// id -> addr GET
export function getAccountAddrById(id: i64): Bech32String | null {
    const value = wasmxw.sload(ACC_BY_ID_KEY + id.toString());
    if (value === "") return null;
    return value;
}

// id -> addr DELETE
export function removeAccountAddrById(id: i64): void {
    wasmxw.sstore(ACC_BY_ID_KEY + id.toString(), "");
}

// id -> addr SET
export function setAccountAddrById(id: i64, addr: Bech32String): void {
    wasmxw.sstore(ACC_BY_ID_KEY + id.toString(), addr);
}

// addr -> account GET
export function getAccountByAddr(addr: Bech32String): AnyWrap | null {
    const value = wasmxw.sload(ACC_BY_ADDR_KEY + addr);
    if (value === "") return null;
    return JSON.parse<AnyWrap>(value);
}

// addr -> account DELETE
export function removeAccountByAddr(addr: Bech32String): void {
    wasmxw.sstore(ACC_BY_ADDR_KEY + addr, "");
}

// addr -> account SET
export function setAccountByAddr(addr: Bech32String, value: AnyWrap): void {
    const data = JSON.stringify<AnyWrap>(value)
    wasmxw.sstore(ACC_BY_ADDR_KEY + addr, data);
}

// account count GET
export function getAccIdLast(): i64 {
    const value = wasmxw.sload(ACC_ID_LAST_KEY)
    if (value == "") return 0;
    return parseInt64(value);
}

// account count SET
export function setAccIdLast(value: i64): void {
    wasmxw.sstore(ACC_ID_LAST_KEY, value.toString())
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

export function getTypeUrlBase(): string {
    return wasmxw.sload(TYPEURL_BASE_KEY);
}

export function setTypeUrlBase(value: string): void {
    return wasmxw.sstore(TYPEURL_BASE_KEY, value);
}

export function getTypeUrlModule(): string {
    return wasmxw.sload(TYPEURL_MODULE_KEY);
}

export function setTypeUrlModule(value: string): void {
    return wasmxw.sstore(TYPEURL_MODULE_KEY, value);
}
