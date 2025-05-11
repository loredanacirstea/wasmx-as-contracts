import { JSON } from "json-as";
import { ChainConfig, NodePorts, StateSyncConfig } from "wasmx-consensus/assembly/types_multichain"
import { Bech32String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "multichain_registry_local"

export const CROSS_CHAIN_TIMEOUT_MS = 120000 // 2 min

@json
export class MsgInitialize {
    ids: string[]
    initialPorts: NodePorts
    constructor(ids: string[], initialPorts: NodePorts) {
        this.ids = ids
        this.initialPorts = initialPorts
    }
}

@json
export class MsgAddSubChainId {
    id: string
    constructor(id: string) {
        this.id = id
    }
}

@json
export class MsgSetInitialPorts {
    initialPorts: NodePorts
    constructor(initialPorts: NodePorts) {
        this.initialPorts = initialPorts
    }
}

@json
export class QuerySubChainIds {}

@json
export class QuerySubChainIdsResponse {
    ids: string[]
    constructor(ids: string[]) {
        this.ids = ids
    }
}

@json
export class QueryNodePortsPerChainId {
    chain_id: string
    constructor(chain_id: string) {
        this.chain_id = chain_id
    }
}

@json
export class QueryNodePortsPerChainIdResponse {
    ports: NodePorts
    constructor(ports: NodePorts) {
        this.ports = ports
    }
}

@json
export class QuerySubChainIdsWithPorts {}

@json
export class QuerySubChainIdsWithPortsResponse {
    ids: string[]
    ports: NodePorts[]
    constructor(ids: string[], ports: NodePorts[]) {
        this.ids = ids
        this.ports = ports
    }
}

@json
export class MsgStartStateSync {
    chain_id: string
    peer_address: string // addr@p2p_addr
    rpc: string
    statesync_config: StateSyncConfig
    verification_chain_id: string
    verification_contract_address: Bech32String
    constructor(chain_id: string, peer_address: string, rpc: string, statesync_config: StateSyncConfig, verification_chain_id: string, verification_contract_address: Bech32String) {
        this.chain_id = chain_id
        this.peer_address = peer_address
        this.rpc = rpc
        this.statesync_config = statesync_config
        this.verification_chain_id = verification_chain_id
        this.verification_contract_address = verification_contract_address
    }
}

@json
export class MsgRegisterNewChain {
    chain_id: string
    chain_config: ChainConfig
    constructor(chain_id: string, chain_config: ChainConfig) {
        this.chain_id = chain_id
        this.chain_config = chain_config
    }
}
