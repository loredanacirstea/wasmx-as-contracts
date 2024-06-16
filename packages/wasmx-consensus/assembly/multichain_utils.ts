import { revert } from "wasmx-env/assembly/wasmx_wrap";
import { ChainConfig, ChainId } from "./types_multichain";
import * as tnd from "./types_tendermint";

const START_EVM_ID = 1000;

// level1ch_1_7000-1
export function buildChainId(chain_base_name: string, level: u32, id: i64, forkIndex: u32): string {
    let evmid = `${START_EVM_ID+id}`
    return `${chain_base_name}_${level}_${evmid}-${forkIndex}`
}

// mythos_1_7000-1
// mythos_7000-1
export function parseChainId(chainId: string): ChainId {
    const parts = chainId.split("_")
    if (parts.length < 2) {
        revert(`invalid chain id: ${chainId}`);
    }
    const baseName = parts[0];
    let level: u32 = 0;
    let lastpart = "";
    if (parts.length == 2) {
        lastpart = parts[1]
    } else {
        level = u32(parseInt(parts[1]))
        lastpart = parts[2]
    }
    const parts2 = lastpart.split("-")
    const evmid = u64(parseInt(parts2[0]))
    const forkIndex = u32(parseInt(parts2[1]))
    return new ChainId(chainId, baseName, level, evmid, forkIndex)
}

export function getLeaderChain(chainIds: string[]): string {
    if (chainIds.length == 0) return "";
    if (chainIds.length == 1) return chainIds[0];
    let higherChain = chainIds[0];
    let higherLevel: u32 = 0;
    for (let i = 0; i < chainIds.length; i++) {
        const id = parseChainId(chainIds[i])
        if (higherLevel < id.level) {
            higherLevel = id.level
            higherChain = id.full;
        }
    }
    return higherChain;
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
