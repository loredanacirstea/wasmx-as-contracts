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
    initial_ports: NodePorts
    constructor(
        init_chain_request: constypes.RequestInitChain,
        chain_config: ChainConfig,
        validator_address: HexString,
        validator_privkey: Base64String,
        validator_pubkey: Base64String,
        peers: string[],
        current_node_id: i32,
        initial_ports: NodePorts,
    ) {
        this.init_chain_request = init_chain_request
        this.chain_config = chain_config
        this.validator_address = validator_address
        this.validator_privkey = validator_privkey
        this.validator_pubkey = validator_pubkey
        this.peers = peers
        this.current_node_id = current_node_id
        this.initial_ports = initial_ports
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
    node_ports: NodePorts
    constructor(chain_id: string, chain_config: ChainConfig, node_ports: NodePorts) {
        this.chain_id = chain_id
        this.chain_config = chain_config
        this.node_ports = node_ports
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

// @ts-ignore
@serializable
export class NodePorts {
    cosmos_rest_api: i32 = 1330 // 1317 // -> 1417
    cosmos_grpc: i32 = 9100 // 9090 // -> 9190
    tendermint_rpc: i32 = 26670 // 26657 // -> 26757
    // tendermint_p2p: i32 = 26656 // not used
    wasmx_network_grpc: i32 = 8100 // 8090 // -> 8190
    evm_jsonrpc: i32 = 8555 // 8545 // -> 8645
    evm_jsonrpc_ws: i32 = 8656 // 8646 // -> 8746
    websrv_web_server: i32 = 9910 // 9900 // -> 9999
    pprof: i32 = 6070 // 6060 // -> 6160
    wasmx_network_p2p: i32 = 5010 // 5001 // -> 5101
    constructor() {
        this.cosmos_rest_api = 1330
        this.cosmos_grpc = 9100
        this.tendermint_rpc = 26670
        // this.tendermint_p2p = 26656
        this.wasmx_network_grpc = 8100
        this.evm_jsonrpc = 8555
        this.evm_jsonrpc_ws = 8656
        this.websrv_web_server = 9910
        this.pprof = 6070
        this.wasmx_network_p2p = 5010
    }

    increment(): NodePorts {
        const node = new NodePorts();
        node.cosmos_rest_api = this.cosmos_rest_api + 1
        node.cosmos_grpc = this.cosmos_grpc + 1
        node.tendermint_rpc = this.tendermint_rpc + 1
        node.wasmx_network_grpc = this.wasmx_network_grpc + 1
        node.evm_jsonrpc = this.evm_jsonrpc + 1
        node.evm_jsonrpc_ws = this.evm_jsonrpc_ws + 1
        node.websrv_web_server = this.websrv_web_server + 1
        node.pprof = this.pprof + 1
        node.wasmx_network_p2p = this.wasmx_network_p2p + 1
        return node;
    }

    static empty(): NodePorts {
        const node = new NodePorts();
        node.cosmos_rest_api = 0
        node.cosmos_grpc = 0
        node.tendermint_rpc = 0
        node.wasmx_network_grpc = 0
        node.evm_jsonrpc = 0
        node.evm_jsonrpc_ws = 0
        node.websrv_web_server = 0
        node.pprof = 0
        node.wasmx_network_p2p = 0
        return node;
    }
}

// @ts-ignore
@serializable
export class StateSyncConfig {
    enable: bool = true
    // Temporary directory for state sync snapshot chunks, defaults to the OS tempdir (typically /tmp).
    //  Will create a new, randomly named directory within, and remove it when done.
	temp_dir: string = ""
    // RPC servers (comma-separated) for light client verification of the synced state machine and
	rpc_servers: string[] = []
    // For Cosmos SDK-based chains, trust_period should usually be about 2/3 of the unbonding time (~2
    // weeks) during which they can be financially punished (slashed) for misbehavior.
	trust_period: i64 = 604800000 // time.Duration // "168h0m0s"
	trust_height: i64 = 0
	trust_hash: string = ""
    // Time to spend discovering snapshots before initiating a restore.
	discovery_time: i64 = 15000 // time.Duration // "15s"
    // The timeout duration before re-requesting a chunk, possibly from a different peer (default: 1 minute).
	chunk_request_timeout: i64 = 10000 // time.Duration // "10s"
    // The number of concurrent chunk fetchers to run (default: 1).
	chunk_fetchers: i32 = 4
    constructor(
        rpc_servers: string[],
        trust_height: i64,
        trust_hash: string,
    ) {
        this.enable = true
        this.temp_dir = ""
        this.rpc_servers = rpc_servers
        this.trust_period = 604800000
        this.trust_height = trust_height
        this.trust_hash = trust_hash
        this.discovery_time = 15000
        this.chunk_request_timeout = 10000
        this.chunk_fetchers = 4
    }
}

// @ts-ignore
@serializable
export class StartStateSyncRequest {
    protocol_id: string
    peer_address: string
    chain_id: string
    chain_config: ChainConfig
    node_ports: NodePorts
    initial_node_ports: NodePorts
    statesync_config: StateSyncConfig
    constructor(protocol_id: string, peer_address: string, chain_id: string, chain_config: ChainConfig, node_ports: NodePorts, initial_node_ports: NodePorts, statesync_config: StateSyncConfig) {
        this.protocol_id = protocol_id
        this.peer_address = peer_address
        this.chain_id = chain_id
        this.chain_config = chain_config
        this.node_ports = node_ports
        this.initial_node_ports = initial_node_ports
        this.statesync_config = statesync_config
    }
}

// @ts-ignore
@serializable
export class StartStateSyncResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}
