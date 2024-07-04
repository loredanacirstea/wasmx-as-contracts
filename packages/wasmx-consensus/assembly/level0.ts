import { ChainConfig, ChainId } from "./types_multichain";

export const Level0ChainIdFull = "level0_1000-1"
export const Level0ChainId = ChainId.fromString(Level0ChainIdFull)

export const Bech32PrefixAccAddr = "level0"
export const Bech32PrefixAccPub = "level0pub"
export const Bech32PrefixValAddr = "level0"
export const Bech32PrefixValPub = "level0pub"
export const Bech32PrefixConsAddr = "level0"
export const Bech32PrefixConsPub = "level0pub"
export const Name = "level0"
export const HumanCoinUnit = "lvl"
export const BaseDenom = "alvl"
export const DenomUnit = "lvl"
export const BaseDenomUnit = 18
export const BondBaseDenom = "aslvl"
export const BondDenom = "slvl"

export const Level0Config = new ChainConfig(
    Bech32PrefixAccAddr,
    Bech32PrefixAccPub,
    Bech32PrefixValAddr,
    Bech32PrefixValPub,
    Bech32PrefixConsAddr,
    Bech32PrefixConsPub,
    Name,
    HumanCoinUnit,
    BaseDenom,
    DenomUnit,
    BaseDenomUnit,
    BondBaseDenom,
    BondDenom,
)
