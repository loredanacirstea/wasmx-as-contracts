import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Bech32String } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn";
import { parseInt32 } from "wasmx-utils/assembly/utils";
import { TokenInfo } from './types';

export const ALLOWANCE_KEY = "allowance_"
export const BALANCE_KEY = "balance_"
export const TOTAL_SUPPLY_KEY = "totalSupply"
export const ADMINS_KEY = "admins"
export const MINTERS_KEY = "minters"
export const INFO_KEY = "info"

export function getBalanceKey(addr: string): string {
    return BALANCE_KEY + addr;
}

export function getAllowanceKey(owner: string, spender: string): string {
    return ALLOWANCE_KEY + owner + "_" + spender;
}

export function setInfo(value: TokenInfo): void {
    wasmxw.sstore(INFO_KEY, JSON.stringify<TokenInfo>(value));
}

export function getInfo(): TokenInfo {
    const value = wasmxw.sload(INFO_KEY);
    if (value == "") return new TokenInfo("", "", 0);
    return JSON.parse<TokenInfo>(value);
}

export function setAdmins(admins: Bech32String[]): void {
    wasmxw.sstore(ADMINS_KEY, JSON.stringify<Bech32String[]>(admins));
}

export function getAdmins(): Bech32String[] {
    const value = wasmxw.sload(ADMINS_KEY);
    if (value == "") return []
    return JSON.parse<Bech32String[]>(value);
}

export function setMinters(minters: Bech32String[]): void {
    wasmxw.sstore(MINTERS_KEY, JSON.stringify<Bech32String[]>(minters));
}

export function getMinters(): Bech32String[] {
    const value = wasmxw.sload(MINTERS_KEY);
    if (value == "") return []
    return JSON.parse<Bech32String[]>(value);
}

export function setTotalSupply(value: BigInt): void {
    wasmxw.sstore(TOTAL_SUPPLY_KEY, value.toString());
}

export function getTotalSupply(): BigInt {
    const value = wasmxw.sload(TOTAL_SUPPLY_KEY);
    if (value == "") return BigInt.zero();
    return BigInt.fromString(value)
}

export function getBalance(
    addr: string,
): BigInt {
    const key = getBalanceKey(addr);
    const value = wasmxw.sload(key);
    if (value == "") return BigInt.zero();
    return BigInt.fromString(value)
}

export function setBalance(
    addr: string,
    amount: BigInt,
): void {
    const key = getBalanceKey(addr);
    wasmxw.sstore(key, amount.toString());
}

export function getAllowance(
    owner: string,
    spender: string,
): BigInt {
    const key = getAllowanceKey(owner, spender);
    const value = wasmxw.sload(key);
    if (value == "") return BigInt.zero();
    return BigInt.fromString(value)
}

export function setAllowance(
    owner: string,
    spender: string,
    amount: BigInt,
): void {
    const key = getAllowanceKey(owner, spender);
    wasmxw.sstore(key, amount.toString());
    return;
}
