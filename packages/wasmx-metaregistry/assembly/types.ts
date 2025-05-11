import { JSON } from "json-as";
import { ChainConfig, ChainId } from "wasmx-consensus/assembly/types_multichain";

export const MODULE_NAME = "metaregistry"

export const CROSS_CHAIN_TIMEOUT_MS = 120000 // 2 min

@json
export class Params {
    current_level: i32 = 0
    constructor(current_level: i32) {
        this.current_level = current_level
    }
}

@json
export class ChainConfigData {
    config: ChainConfig
    chain_id: ChainId
    constructor(config: ChainConfig, chain_id: ChainId) {
        this.config = config
        this.chain_id = chain_id
    }
}

@json
export class MsgInitialize {
    params: Params
    constructor(params: Params) {
        this.params = params
    }
}

@json
export class MsgSetChainDataRequest {
    data: ChainConfigData
    constructor(data: ChainConfigData) {
        this.data = data
    }
}

@json
export class MsgSetChainDataResponse {}

@json
export class QueryGetChainDataRequest {
    chain_id: string
    constructor(chain_id: string) {
        this.chain_id = chain_id
    }
}

@json
export class QueryGetChainDataResponse {
    data: ChainConfigData
    constructor(data: ChainConfigData) {
        this.data = data
    }
}

@json
export class QueryGetSubChainRequest {
    chainId: string
    constructor(chainId: string) {
        this.chainId = chainId
    }
}

@json
export class QueryGetSubChainsByIdsRequest {
    ids: string[]
    constructor(ids: string[]) {
        this.ids = ids
    }
}

@json
export class QuerySubChainConfigByIdsRequest {
    ids: string[]
    constructor(ids: string[]) {
        this.ids = ids
    }
}
