import { JSON } from "json-as/assembly";
import { InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";

export const SPLIT = "."
const CHAIN_IDS = "chainids"
const DATA_KEY = "chain_data."

// chain_id => chain data
export function getDataKey(chainId: string): string {
    return DATA_KEY + chainId
}

export function getChainData(chainId: string): InitSubChainDeterministicRequest | null {
    const value = wasmxw.sload(getDataKey(chainId));
    if (value == "") return null;
    return JSON.parse<InitSubChainDeterministicRequest>(value);
}

export function setChainData(data: InitSubChainDeterministicRequest): void {
    const datastr = JSON.stringify<InitSubChainDeterministicRequest>(data);
    return wasmxw.sstore(getDataKey(data.init_chain_request.chain_id), datastr);
}

export function addChainId(data: string): void {
    const ids = getChainIds()
    if (ids.includes(data)) return
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
