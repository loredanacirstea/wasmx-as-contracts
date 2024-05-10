import { JSON } from "json-as/assembly";
import * as constypes from "./types_tendermint"

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
export class InitSubChainMsg {
    init_chain_request: constypes.RequestInitChain
    chain_config: ChainConfig
    validator_address: HexString
    validator_privkey: Base64String
    validator_pubkey: Base64String
    peers: string[]
    constructor(
        init_chain_request: constypes.RequestInitChain,
        chain_config: ChainConfig,
        validator_address: HexString,
        validator_privkey: Base64String,
        validator_pubkey: Base64String,
        peers: string[],
    ) {
        this.init_chain_request = init_chain_request
        this.chain_config = chain_config
        this.validator_address = validator_address
        this.validator_privkey = validator_privkey
        this.validator_pubkey = validator_pubkey
        this.peers = peers
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
