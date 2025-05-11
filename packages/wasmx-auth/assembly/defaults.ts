import { GenesisState, Params, TypeUrl_BaseAccount, TypeUrl_ModuleAccount } from "./types";

export const max_memo_characters = 256
export const tx_sig_limit = 7
export const tx_size_cost_per_byte = 10
export const sig_verify_cost_ed25519 = 590
export const sig_verify_cost_secp256k1 = 1000

export function getDefaultParams(): Params {
    return new Params(
        max_memo_characters,
        tx_sig_limit,
        tx_size_cost_per_byte,
        sig_verify_cost_ed25519,
        sig_verify_cost_secp256k1,
    )
}

export function getDefaultGenesis(): GenesisState {
    const params = getDefaultParams()
    return new GenesisState(
        params,
        [],
        TypeUrl_BaseAccount,
        TypeUrl_ModuleAccount,
    )
}
