import { JSON } from "json-as/assembly";
import { BlockCommit, BlockID, ValidatorSet } from "wasmx-consensus/assembly/types_tendermint";
import { Base64String, HexString } from "wasmx-env/assembly/types";

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
export class VerifyCommitLightRequest {
    chain_id: string
    block_id: BlockID
    height: i64
    commit: BlockCommit
    valset: ValidatorSet
    constructor(
        chain_id: string,
        block_id: BlockID,
        height: i64,
        commit: BlockCommit,
        valset: ValidatorSet,
    ) {
        this.chain_id = chain_id
        this.block_id = block_id
        this.height = height
        this.commit = commit
        this.valset = valset
    }
}

// @ts-ignore
@serializable
export class VerifyCommitLightResponse {
    valid: boolean = false
    error: string = ""
    constructor(valid: boolean, error: string) {
        this.valid = valid
        this.error = error
    }
}
