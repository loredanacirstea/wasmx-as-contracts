import { JSON } from "json-as/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";

export const GENTX_KEY = "gentx."
export const LAST_CHAIN_ID = "chainid_last"
export const CURRENT_LEVEL = "current_level"

export function gentxKey(chainId: string): string {

}


export function addGenTx(data: string): void {
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
