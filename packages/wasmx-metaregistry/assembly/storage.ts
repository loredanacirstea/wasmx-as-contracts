import { JSON } from "json-as";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { revert } from "./utils";
import { ChainConfigData, Params } from "./types";

export const SPLIT = "."
export const PARAMS_KEY = "params"
export const DATA_KEY = "chain_data."

export const INITIAL_LEVEL = 1

// chain_id => chain data
export function getDataKey(chainId: string): string {
    return DATA_KEY + chainId
}

export function getChainData(chainId: string): ChainConfigData | null {
    const value = wasmxw.sload(getDataKey(chainId));
    if (value == "") return null;
    return JSON.parse<ChainConfigData>(value);
}

export function setChainData(data: ChainConfigData): void {
    const datastr = JSON.stringify<ChainConfigData>(data);
    wasmxw.sstore(getDataKey(data.chain_id.full), datastr);
}

export function getParams(): Params {
    const value = wasmxw.sload(PARAMS_KEY);
    if (value == "") return new Params(0);
    return JSON.parse<Params>(value);
}

export function setParams(data: Params): void {
    return wasmxw.sstore(PARAMS_KEY, JSON.stringify<Params>(data));
}
