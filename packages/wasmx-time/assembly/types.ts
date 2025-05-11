import { JSON } from "json-as";
import {Base64String} from 'wasmx-env/assembly/types';

export const MODULE_NAME = "time"

@json
export class Header {
    index: i64
    time: Date
    lastBlockHash: Base64String
    // TODO see if we include the chain_id or not; this should be the machine's identity
    chain_id: Base64String
    entropy: Base64String
    constructor(
        index: i64,
        time: Date,
        lastBlockHash: Base64String,
        chain_id: Base64String,
        entropy: Base64String,
    ) {
        this.index = index
        this.time = time
        this.lastBlockHash = lastBlockHash
        this.chain_id = chain_id
        this.entropy = entropy
    }
}


@json
export class Block {
    header: Header
    hash: Base64String
    constructor(
        header: Header,
        hash: Base64String,
    ) {
        this.header = header
        this.hash = hash
    }
}

@json
export class Params {
    chain_id: string
    interval_ms: i64
    constructor(chain_id: string, interval_ms: i64) {
        this.chain_id = chain_id
        this.interval_ms = interval_ms
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
export class MsgStart {}

@json
export class QueryLastBlockRequest {}

@json
export class QueryBlockRequest {
    time: Date
    constructor(time: Date) {
        this.time = time
    }
}
