import { JSON } from "json-as/assembly";
import { Base64String, HexString } from "wasmx-env/assembly/types";
import { Version, BlockID, CommitSig, BlockIDFlag } from 'wasmx-consensus/assembly/types_tendermint';

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
export class CurrentState {
    chain_id: string
    app_hash: string // updated after Finalized Block
    // prev block info
    last_block_id: BlockID // updated after Finalized Block
    // commit from validators from the last block
    last_commit_hash: Base64String
    // tx results hash
    last_results_hash: Base64String
    validator_address: HexString
    validator_privkey: Base64String
    validator_pubkey: Base64String

    nextHeight: i64
    nextHash: Base64String

    constructor(chain_id: string, app_hash: string, last_block_id: BlockID, last_commit_hash: Base64String, last_results_hash: Base64String, validator_address: HexString, validator_privkey: Base64String, validator_pubkey: Base64String,
        nextHeight: i64,
        nextHash: Base64String,
    ) {
        this.chain_id = chain_id
        this.app_hash = app_hash
        this.last_block_id = last_block_id
        this.last_commit_hash = last_commit_hash
        this.last_results_hash = last_results_hash
        this.validator_address = validator_address
        this.validator_privkey = validator_privkey
        this.validator_pubkey = validator_pubkey
        this.nextHeight = nextHeight
        this.nextHash = nextHash
    }
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
