import { Coin } from "wasmx-env/assembly/types";
import { GenesisState, Params } from "./types";
import { BigInt } from "wasmx-env/assembly/bn";

export const signed_blocks_window = 10000
export const min_signed_per_window = "0.500000000000000000"
export const downtime_jail_duration = "600s" // 10 min
export const slash_fraction_double_sign = "0.000000000000000000"
export const slash_fraction_downtime = "0.000000000000000000"

export function getDefaultParams(): Params {
    return new Params(
        signed_blocks_window,
        min_signed_per_window,
        downtime_jail_duration,
        slash_fraction_double_sign,
        slash_fraction_downtime,
    )
}

export function getDefaultGenesis(): GenesisState {
    const params = getDefaultParams()
    return new GenesisState(
        params,
        [],
        [],
    )
}
