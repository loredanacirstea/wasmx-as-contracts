import { Coin } from "wasmx-env/assembly/types";
import { GenesisState, Params } from "./types";
import { BigInt } from "wasmx-env/assembly/bn";

export const DefaultStartingProposalID = 1;
export const DefaultMinDepositTokens = "10000000";
export const DefaultMinExpeditedDepositTokensRatio: u32 = 5;
export const DefaultDepositPeriod = 172800000; // 48h
export const DefaultVotingPeriod = 172800000; // 48h
export const DefaultVotingExpedited = 86400000; // 24h
export const DefaultQuorum = "0.334000000000000000"
export const DefaultThreshold = "0.500000000000000000"
export const DefaultVetoThreshold = "0.334000000000000000"
export const min_initial_deposit_ratio = "0.000000000000000000"
export const proposal_cancel_ratio = "0.500000000000000000"
export const proposal_cancel_dest = ""
export const expedited_threshold = "0.667000000000000000"
export const burn_vote_quorum = false
export const burn_proposal_deposit_prevote = false
export const burn_vote_veto = true
export const min_deposit_ratio = "0.010000000000000000"

export function getDefaultParams(deposit_denom: string): Params {
    return new Params(
        [new Coin(deposit_denom, BigInt.fromString(DefaultMinDepositTokens, 10))],
        DefaultDepositPeriod,
        DefaultVotingPeriod,
        DefaultQuorum,
        DefaultThreshold,
        DefaultVetoThreshold,
        min_deposit_ratio,
        proposal_cancel_ratio,
        proposal_cancel_dest,
        DefaultVotingExpedited,
        expedited_threshold,
        [new Coin(deposit_denom, BigInt.fromString(DefaultMinDepositTokens, 10).mul(BigInt.fromU32(DefaultMinExpeditedDepositTokensRatio)))],
        burn_vote_quorum,
        burn_proposal_deposit_prevote,
        burn_vote_veto,
        min_deposit_ratio,
    )
}

export function getDefaultGenesis(baseDenom: string, defaultBondDenom: string, rewardsBaseDenom: string): GenesisState {
    const params = getDefaultParams(baseDenom)
    return new GenesisState(
        DefaultStartingProposalID,
        [],
        [],
        [],
        params,
        "",
    )
}
