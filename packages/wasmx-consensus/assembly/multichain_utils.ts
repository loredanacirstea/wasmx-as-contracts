import { ChainConfig } from "./types_multichain";
import * as tnd from "./types_tendermint";

const COUNT_EVM_ID = 5;

export function buildChainId(chain_base_name: string, level: u32, id: i64, forkIndex: u32): string {
    let evmid = `${id}`.padStart(COUNT_EVM_ID-1, "0")
    return `${chain_base_name}_${level}${evmid}-${forkIndex}`
}

export function buildChainConfig(denom_unit: string, base_denom_unit: u32, chain_base_name: string): ChainConfig {
    const Bech32PrefixAccAddr = chain_base_name
    const Bech32PrefixAccPub = chain_base_name + "pub"
    const Bech32PrefixValAddr = chain_base_name
    const Bech32PrefixValPub = chain_base_name + "pub"
    const Bech32PrefixConsAddr = chain_base_name
    const Bech32PrefixConsPub = chain_base_name + "pub"
    const Name = chain_base_name
    const HumanCoinUnit = denom_unit
    const BaseDenom = "a" + denom_unit
    const DenomUnit = denom_unit
    const BondBaseDenom = "as" + denom_unit
    const BondDenom = "s" + denom_unit

    return new ChainConfig(Bech32PrefixAccAddr, Bech32PrefixAccPub, Bech32PrefixValAddr, Bech32PrefixValPub, Bech32PrefixConsAddr, Bech32PrefixConsPub, Name, HumanCoinUnit, BaseDenom, DenomUnit, base_denom_unit, BondBaseDenom, BondDenom)
}

export function getDefaultConsensusParams(): tnd.ConsensusParams {
    const BlockParams = new tnd.BlockParams(
        22020096,
        30000000, // -1 no limit
    )
    const EvidenceParams = new tnd.EvidenceParams(
        100000,
        172800000000000, // 3 weeks is the max duration
        1048576,
    )
    const PubKeyTypes: string[] = ["ed25519"]
    const ValidatorParams = new tnd.ValidatorParams(PubKeyTypes)
    const VersionParams = new tnd.VersionParams(0)
    const ABCIParams = new tnd.ABCIParams(0)

    return new tnd.ConsensusParams(BlockParams, EvidenceParams, ValidatorParams, VersionParams, ABCIParams)
}
