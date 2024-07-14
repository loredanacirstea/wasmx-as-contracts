import { JSON } from "json-as/assembly";
import { ChainConfig, ChainId } from "wasmx-consensus/assembly/types_multichain";

export const MODULE_NAME = "metaregistry"

// @ts-ignore
@serializable
export class Params {
    current_level: i32 = 0
    constructor(current_level: i32) {
        this.current_level = current_level
    }
}

// @ts-ignore
@serializable
export class ChainConfigData {
    config: ChainConfig
    chain_id: ChainId
    constructor(config: ChainConfig, chain_id: ChainId) {
        this.config = config
        this.chain_id = chain_id
    }
}

// @ts-ignore
@serializable
export class MsgInitialize {
    params: Params
    constructor(params: Params) {
        this.params = params
    }
}

// @ts-ignore
@serializable
export class MsgSetChainDataRequest {
    data: ChainConfigData
    constructor(data: ChainConfigData) {
        this.data = data
    }
}

// @ts-ignore
@serializable
export class MsgSetChainDataResponse {}

// @ts-ignore
@serializable
export class QueryGetChainDataRequest {
    chain_id: string
    constructor(chain_id: string) {
        this.chain_id = chain_id
    }
}

// @ts-ignore
@serializable
export class QueryGetChainDataResponse {
    data: ChainConfigData
    constructor(data: ChainConfigData) {
        this.data = data
    }
}

// @ts-ignore
@serializable
export class QueryGetSubChainRequest {
    chainId: string
    constructor(chainId: string) {
        this.chainId = chainId
    }
}

// @ts-ignore
@serializable
export class QueryGetSubChainsByIdsRequest {
    ids: string[]
    constructor(ids: string[]) {
        this.ids = ids
    }
}

// @ts-ignore
@serializable
export class QuerySubChainConfigByIdsRequest {
    ids: string[]
    constructor(ids: string[]) {
        this.ids = ids
    }
}
