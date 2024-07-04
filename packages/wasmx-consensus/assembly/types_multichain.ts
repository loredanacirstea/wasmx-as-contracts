import { JSON } from "json-as/assembly";
import { revert } from "wasmx-env/assembly/wasmx_wrap";
import * as constypes from "./types_tendermint"

const START_EVM_ID = 1000;

// @ts-ignore
@serializable
export type HexString = string;
// @ts-ignore
@serializable
export type Base64String = string;

// @ts-ignore
@serializable
export class ChainConfig {
    Bech32PrefixAccAddr: string = ""
	Bech32PrefixAccPub: string = ""
	Bech32PrefixValAddr: string = ""
	Bech32PrefixValPub: string = ""
	Bech32PrefixConsAddr: string = ""
	Bech32PrefixConsPub: string = ""
	Name: string = ""
	HumanCoinUnit: string = ""
	BaseDenom: string = ""
	DenomUnit: string = ""
	BaseDenomUnit: u32 = 18
	BondBaseDenom: string = ""
	BondDenom: string = ""
    constructor(
        Bech32PrefixAccAddr: string,
        Bech32PrefixAccPub: string,
        Bech32PrefixValAddr: string,
        Bech32PrefixValPub: string,
        Bech32PrefixConsAddr: string,
        Bech32PrefixConsPub: string,
        Name: string,
        HumanCoinUnit: string,
        BaseDenom: string,
        DenomUnit: string,
        BaseDenomUnit: u32,
        BondBaseDenom: string,
        BondDenom: string,
    ) {
        this.Bech32PrefixAccAddr = Bech32PrefixAccAddr
        this.Bech32PrefixAccPub = Bech32PrefixAccPub
        this.Bech32PrefixValAddr = Bech32PrefixValAddr
        this.Bech32PrefixValPub = Bech32PrefixValPub
        this.Bech32PrefixConsAddr = Bech32PrefixConsAddr
        this.Bech32PrefixConsPub = Bech32PrefixConsPub
        this.Name = Name
        this.HumanCoinUnit = HumanCoinUnit
        this.BaseDenom = BaseDenom
        this.DenomUnit = DenomUnit
        this.BaseDenomUnit = BaseDenomUnit
        this.BondBaseDenom = BondBaseDenom
        this.BondDenom = BondDenom
    }
}

// @ts-ignore
@serializable
export class InitSubChainDeterministicRequest {
    init_chain_request: constypes.RequestInitChain
    chain_config: ChainConfig
    peers: string[]
    constructor(
        init_chain_request: constypes.RequestInitChain,
        chain_config: ChainConfig,
        peers: string[],
    ) {
        this.init_chain_request = init_chain_request
        this.chain_config = chain_config
        this.peers = peers
    }
}

// @ts-ignore
@serializable
export type GenesisState = Map<string,Base64String>

// @ts-ignore
@serializable
export class GenutilGenesis {
    gen_txs: Base64String[]
    constructor(gen_txs: Base64String[]) {
        this.gen_txs = gen_txs
    }
}

// @ts-ignore
@serializable
export class InitSubChainMsg {
    init_chain_request: constypes.RequestInitChain
    chain_config: ChainConfig
    validator_address: HexString
    validator_privkey: Base64String
    validator_pubkey: Base64String
    peers: string[]
    current_node_id: i32 = 0
    constructor(
        init_chain_request: constypes.RequestInitChain,
        chain_config: ChainConfig,
        validator_address: HexString,
        validator_privkey: Base64String,
        validator_pubkey: Base64String,
        peers: string[],
        current_node_id: i32,
    ) {
        this.init_chain_request = init_chain_request
        this.chain_config = chain_config
        this.validator_address = validator_address
        this.validator_privkey = validator_privkey
        this.validator_pubkey = validator_pubkey
        this.peers = peers
        this.current_node_id = current_node_id
    }
}

// @ts-ignore
@serializable
export class NewSubChainDeterministicData {
    init_chain_request: constypes.RequestInitChain
    chain_config: ChainConfig
    constructor(
        init_chain_request: constypes.RequestInitChain,
        chain_config: ChainConfig,
    ) {
        this.init_chain_request = init_chain_request
        this.chain_config = chain_config
    }
}

// @ts-ignore
@serializable
export class StartSubChainMsg {
    chain_id: string
    chain_config: ChainConfig
    constructor(chain_id: string, chain_config: ChainConfig) {
        this.chain_id = chain_id
        this.chain_config = chain_config
    }
}

// @ts-ignore
@serializable
export class StartSubChainResponse {
    error: string = ""
}

// @ts-ignore
@serializable
export class ChainId {
    full: string = ""
    base_name: string = ""
    level: u32 = 0
    evmid: u64 = 0
    fork_index: u32 = 0
    constructor(
        full: string = "",
        base_name: string = "",
        level: u32 = 0,
        evmid: u64 = 0,
        fork_index: u32 = 0,
    ) {
        this.full = full
        this.base_name = base_name
        this.level = level
        this.evmid = evmid
        this.fork_index = fork_index

        if (full == "") {
            this.full = ChainId.toString(base_name, level, evmid, fork_index)
        }
    }

    // mythos_1_7000-1
    // mythos_7000-1
    static fromString(chainId: string): ChainId {
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

    // level1ch_1_7000-1
    static toString(chain_base_name: string, level: u32, evmid: i64, forkIndex: u32): string {
        if (evmid < START_EVM_ID) {
            evmid += START_EVM_ID
        }
        return `${chain_base_name}_${level}_${evmid}-${forkIndex}`
    }
}
