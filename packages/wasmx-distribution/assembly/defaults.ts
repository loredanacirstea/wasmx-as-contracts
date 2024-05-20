import { FeePool, GenesisState, Params } from "./types";

export function getDefaultParams(): Params {
    return new Params(
        "0.000000000000000000",
        "0.000000000000000000",
        "0.000000000000000000",
        true,
    )
}

export function getDefaultGenesis(baseDenom: string, rewardsDenom: string): GenesisState {
    const params = getDefaultParams()
    return new GenesisState(
        params,
        new FeePool([]),
        [],
        "",
        [],
        [],
        [],
        [],
        [],
        [],
        baseDenom,
        rewardsDenom,
    )
}
