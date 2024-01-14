import { JSON } from "json-as/assembly";
import * as wasmxwrap from "wasmx-env/assembly/wasmx_wrap";
import { ChainInfo, Chains, Config } from "./types";

// config
const MIN_VALIDATORS_DEFAULT = 3;

// storage keys
const CONFIG_KEY = "config";
const CHAINS_KEY = "chains";
const CHAIN_KEY = "chain_";

export function getChains(): Chains {
    const chains = wasmxwrap.sload(CHAINS_KEY);
    if (chains == "") return new Chains([]);
    return JSON.parse<Chains>(chains);
}

export function setChains(chains: Chains) {
    wasmxwrap.sstore(CHAINS_KEY, JSON.stringify<Chains>(chains));
}

export function getConfig(): Config {
    const value = wasmxwrap.sload(CONFIG_KEY);
    if (value == "") return new Config(MIN_VALIDATORS_DEFAULT);
    return JSON.parse<Config>(value);
}

export function setConfig(value: Config) {
    wasmxwrap.sstore(CONFIG_KEY, JSON.stringify<Config>(value));
}

export function getChainInfo(chainId: string): ChainInfo | null {
    const value = wasmxwrap.sload(CHAIN_KEY + chainId);
    if (value == "") return null;
    return JSON.parse<ChainInfo>(value);
}

export function setChainInfo(chainId: string, value: ChainInfo) {
    wasmxwrap.sstore(CHAIN_KEY + chainId, JSON.stringify<ChainInfo>(value));
}
