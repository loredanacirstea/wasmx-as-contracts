import { JSON } from "json-as/assembly";
import { InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";

export const SPLIT = "."
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
    return wasmxw.sstore(getDataKey(data.init_chain_request.chain_id), JSON.stringify<InitSubChainDeterministicRequest>(data));
}
