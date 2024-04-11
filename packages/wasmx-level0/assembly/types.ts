import { JSON } from "json-as/assembly";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "level0"

// @ts-ignore
@serializable
export class EmptyRequest {}


// @ts-ignore
@serializable
export class MsgInitialize {
}

// @ts-ignore
@serializable
export class MsgNewTransaction {
    transaction: Base64String
    constructor(transaction: Base64String) {
        this.transaction = transaction
    }
}

// @ts-ignore
@serializable
export class MsgNewTransactionResponse {
    transactionHash: Base64String
    blockHash: Base64String
    constructor(transactionHash: Base64String, blockHash: Base64String) {
        this.transactionHash = transactionHash
        this.blockHash = blockHash
    }
}

// @ts-ignore
@serializable
export class Header {
    index: i64
    time: Date
    lastBlockHash: Base64String
    // TODO see if we include the chain_id or not; this should be the machine's identity
    chain_id: Base64String
    dataHash: Base64String
    constructor(
        index: i64,
        time: Date,
        lastBlockHash: Base64String,
        chain_id: Base64String,
        dataHash: Base64String,
    ) {
        this.index = index
        this.time = time
        this.lastBlockHash = lastBlockHash
        this.chain_id = chain_id
        this.dataHash = dataHash
    }
}

// @ts-ignore
@serializable
export class Block {
    data: Base64String[]
    header: Header
    hash: Base64String
    data_hashes: Base64String[]
    constructor(data: Base64String[], header: Header, hash: Base64String, data_hashes: Base64String[]) {
        this.data = data
        this.header = header
        this.hash = hash
        this.data_hashes = data_hashes
    }
}
