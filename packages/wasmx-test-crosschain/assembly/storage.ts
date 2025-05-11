import { JSON } from "json-as";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { Bech32String } from "wasmx-env/assembly/types";

export const CROSS_CHAIN_CONTRACT_KEY = "crosschain_contract"

export function getCrossChainContract(): Bech32String {
    return wasmxw.sload(CROSS_CHAIN_CONTRACT_KEY);
}

export function setCrossChainContract(addr: Bech32String): void {
    return wasmxw.sstore(CROSS_CHAIN_CONTRACT_KEY, addr);
}
