import { JSON } from "json-as/assembly";
import { Base64String, HexString } from "wasmx-env/assembly/types";
import * as stakingtypes from "wasmx-stake/assembly/types";

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
