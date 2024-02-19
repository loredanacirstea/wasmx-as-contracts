import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Params, StoredAccount } from "./types";
import { parseInt64 } from "wasmx-utils/assembly/utils";
import { Bech32String } from "wasmx-env/assembly/types";

export const SPLIT = "."
export const PARAM_KEY = "params"
export const ACC_ID_LAST_KEY = "account_id_last"
export const ACC_BY_ADDR_KEY = "account."
export const ACC_BY_ID_KEY = "account_addr."

export function addNewAccount(value: StoredAccount): void {
    const id = addAccountAddrById(value.address)
    value.account_number = id;
    setAccountByAddr(value);
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
export function getAccountByAddr(addr: Bech32String): StoredAccount | null {
    const value = wasmxw.sload(ACC_BY_ADDR_KEY + addr);
    if (value === "") return null;
    return JSON.parse<StoredAccount>(value);
}

// addr -> account DELETE
export function removeAccountByAddr(addr: Bech32String): void {
    wasmxw.sstore(ACC_BY_ADDR_KEY + addr, "");
}

// addr -> account SET
export function setAccountByAddr(value: StoredAccount): void {
    wasmxw.sstore(ACC_BY_ADDR_KEY + value.address, JSON.stringify<StoredAccount>(value));
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
