import { JSON } from "json-as";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';

export const SUBCHAINS_KEY = "subchains"

export function setSubChains(ids: string[]): void {
    wasmxw.sstore(SUBCHAINS_KEY, JSON.stringify<string[]>(ids));
}

export function getSubChains(): string[] {
    const value = wasmxw.sload(SUBCHAINS_KEY);
    if (value == "") return []
    return JSON.parse<string[]>(value);
}
