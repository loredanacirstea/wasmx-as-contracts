import { JSON } from "json-as/assembly";
import { NodePorts } from "wasmx-consensus/assembly/types_multichain"

export const MODULE_NAME = "multichain_registry_local"

export const CROSS_CHAIN_TIMEOUT_MS = 120000 // 2 min

// @ts-ignore
@serializable
export class MsgInitialize {
    ids: string[]
    initialPorts: NodePorts
    constructor(ids: string[], initialPorts: NodePorts) {
        this.ids = ids
        this.initialPorts = initialPorts
    }
}

// @ts-ignore
@serializable
export class MsgAddSubChainId {
    id: string
    constructor(id: string) {
        this.id = id
    }
}

// @ts-ignore
@serializable
export class MsgSetInitialPorts {
    initialPorts: NodePorts
    constructor(initialPorts: NodePorts) {
        this.initialPorts = initialPorts
    }
}

// @ts-ignore
@serializable
export class QuerySubChainIds {}

// @ts-ignore
@serializable
export class QuerySubChainIdsResponse {
    ids: string[]
    constructor(ids: string[]) {
        this.ids = ids
    }
}

// @ts-ignore
@serializable
export class QueryNodePortsPerChainId {
    chain_id: string
    constructor(chain_id: string) {
        this.chain_id = chain_id
    }
}

// @ts-ignore
@serializable
export class QueryNodePortsPerChainIdResponse {
    ports: NodePorts
    constructor(ports: NodePorts) {
        this.ports = ports
    }
}

// @ts-ignore
@serializable
export class QuerySubChainIdsWithPorts {}

// @ts-ignore
@serializable
export class QuerySubChainIdsWithPortsResponse {
    ids: string[]
    ports: NodePorts[]
    constructor(ids: string[], ports: NodePorts[]) {
        this.ids = ids
        this.ports = ports
    }
}
