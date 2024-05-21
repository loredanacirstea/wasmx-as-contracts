import { Coin } from "wasmx-env/assembly/types";
import { GenesisState, Params } from "./types";
import { BigInt } from "wasmx-env/assembly/bn";

export const unbonding_time = "1814400s"
export const max_validators = 100
export const max_entries = 7
export const historical_entries = 10000
export const min_commission_rate = "0.000000000000000000"

export function getDefaultParams(bondDenom: string): Params {
    return new Params(
        unbonding_time,
        max_validators,
        max_entries,
        historical_entries,
        bondDenom,
        min_commission_rate,
    )
}

export function getDefaultGenesis(bondBaseDenom: string): GenesisState {
    const params = getDefaultParams(bondBaseDenom)
    return new GenesisState(
        params,
        "0",
        [],
        [],
        [],
        [],
        [],
        bondBaseDenom,
    )
}
