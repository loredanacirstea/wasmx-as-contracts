import { JSON } from "json-as/assembly";
import { BigInt } from "wasmx-env/assembly/bn";
import {HexString, Base64String, Bech32String} from 'wasmx-env/assembly/types';

export const MODULE_NAME = "time"

// @ts-ignore
@serializable
export class Header {
    index: BigInt
    time: Date
    lastBlockHash: Base64String
    chain_id: Base64String
    entropy: Base64String
    constructor(
        index: BigInt,
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


// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class Params {
    chain_id: string
    constructor(chain_id: string) {
        this.chain_id = chain_id
    }
}
