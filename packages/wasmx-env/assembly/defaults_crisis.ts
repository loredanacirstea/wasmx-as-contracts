import { JSON } from "json-as/assembly";
import { Coin } from "./types";
import { BigInt } from "./bn";

export const CONSTANT_FEE: u64 = 1000

// @ts-ignore
@serializable
export class GenesisState {
    constant_fee: Coin
    constructor(constant_fee: Coin) {
        this.constant_fee = constant_fee
    }
}

export function getDefaultGenesis(bondBaseDenom: string): GenesisState {
    return new GenesisState(new Coin(bondBaseDenom, BigInt.fromU64(CONSTANT_FEE)))
}
