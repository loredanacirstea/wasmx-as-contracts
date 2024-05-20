import { JSON } from "json-as/assembly";
import { AnyWrap } from "./wasmx_types";

// @ts-ignore
@serializable
export class  Minter {
    inflation: string
    annual_provisions: string
    constructor(inflation: string, annual_provisions: string) {
        this.inflation = inflation
        this.annual_provisions = annual_provisions
    }
}

// @ts-ignore
@serializable
export class  Params {
    mint_denom: string
    inflation_rate_change: string
    inflation_max: string
    inflation_min: string
    goal_bonded: string
    blocks_per_year: string
    constructor(
        mint_denom: string,
        inflation_rate_change: string,
        inflation_max: string,
        inflation_min: string,
        goal_bonded: string,
        blocks_per_year: string,
    ) {
        this.mint_denom = mint_denom
        this.inflation_rate_change = inflation_rate_change
        this.inflation_max = inflation_max
        this.inflation_min = inflation_min
        this.goal_bonded = goal_bonded
        this.blocks_per_year = blocks_per_year
    }
}

// @ts-ignore
@serializable
export class GenesisState {
    minter: Minter
    params: Params
    constructor(minter: Minter, params: Params) {
        this.minter = minter
        this.params = params
    }
}

export const inflation = "0.130000000000000000"
export const annual_provisions = "0.000000000000000000"

export const inflation_rate_change = "0.130000000000000000"
export const inflation_max = "0.200000000000000000"
export const inflation_min = "0.070000000000000000"
export const goal_bonded = "0.670000000000000000"
export const blocks_per_year = "6311520"

export function getDefaultMinter(): Minter {
    return new Minter(inflation, annual_provisions)
}

export function getDefaultParams(mintBaseDenom: string): Params {
    return new Params(
        mintBaseDenom,
        inflation_rate_change,
        inflation_max,
        inflation_min,
        goal_bonded,
        blocks_per_year,
    )
}

export function getDefaultGenesis(mintBaseDenom: string): GenesisState {
    return new GenesisState(getDefaultMinter(), getDefaultParams(mintBaseDenom))
}
