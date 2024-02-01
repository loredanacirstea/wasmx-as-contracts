import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Bech32String } from 'wasmx-env/assembly/types';
import { TokenInfo } from './types';
import { parseInt32 } from "wasmx-utils/assembly/utils";

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

export function setTotalSupply(value: i64): void {
    wasmxw.sstore(TOTAL_SUPPLY_KEY, value.toString());
}

export function getTotalSupply(): i64 {
    const value = wasmxw.sload(TOTAL_SUPPLY_KEY);
    if (value == "") return 0;
    return parseInt32(value);
}

export function getBalance(
    addr: string,
): i64 {
    const key = getBalanceKey(addr);
    const balancestr = wasmxw.sload(key);
    if (balancestr) {
        const balance = parseInt(balancestr);
        return i64(balance);
    }
    return i64(0);
}

export function setBalance(
    addr: string,
    amount: i64,
): void {
    const key = getBalanceKey(addr);
    wasmxw.sstore(key, amount.toString());
}

export function getAllowance(
    owner: string,
    spender: string,
): i64 {
    const key = getAllowanceKey(owner, spender);
    const allowancestr = wasmxw.sload(key);
    if (allowancestr) {
        const allowance = parseInt(allowancestr);
        return i64(allowance);
    }
    return i64(0);
}

export function setAllowance(
    owner: string,
    spender: string,
    amount: i64,
): void {
    const key = getAllowanceKey(owner, spender);
    wasmxw.sstore(key, amount.toString());
    return;
}
