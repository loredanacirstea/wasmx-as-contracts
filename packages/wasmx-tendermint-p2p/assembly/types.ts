import { JSON } from "json-as/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import * as stakingtypes from "wasmx-stake/assembly/types";
import { Base64String, Bech32String, Coin } from "wasmx-env/assembly/types";
import { NodeInfo } from "wasmx-p2p/assembly/types";
import { ValidatorQueueEntry } from "wasmx-tendermint/assembly/types_blockchain";
import { GetProposerResponse } from "./types_blockchain";

// @ts-ignore
@serializable
export class LogEntry {
    // this is also the block height
    index: i64;
    termId: i64;
    leaderId: i32;
    data: Base64String; // empty for finalized blocks;
    constructor(index: i64, termId: i64, leaderId: i32, data: string) {
        this.index = index;
        this.termId = termId;
        this.leaderId = leaderId;
        this.data = data;
    }
}

// @ts-ignore
@serializable
export class LogEntryAggregate {
    // this is also the block height
    index: i64;
    termId: i64;
    leaderId: i32;
    data: wblocks.BlockEntry;
    constructor(index: i64, termId: i64, leaderId: i32, data: wblocks.BlockEntry) {
        this.index = index;
        this.termId = termId;
        this.leaderId = leaderId;
        this.data = data;
    }
}

// @ts-ignore
@serializable
export class Transaction {
    from: string;
    to: string;
    funds: Array<Coin>;
    data: string;
    gas: i64;
    price: i64;
    constructor(from: string, to: string, funds: Array<Coin>, data: string, gas: i64, price: i64) {
        this.from = from;
        this.to = to;
        this.funds = funds;
        this.data = data;
        this.gas = gas;
        this.price = price;
    }
}

// @ts-ignore
@serializable
export class TransactionResponse {
    termId: i64;
    leaderId: i32;
    index: i64;
    constructor(termId: i64, leaderId: i32, index: i64) {
        this.termId = termId;
        this.leaderId = leaderId;
        this.index = index;
    }
}

// @ts-ignore
@serializable
export class AppendEntry {
    // leader’s term
    termId: i64;
    // so follower can redirect clients
    proposerId: i32;
    // we set this for the current state, to only be used in force proposal reset
    proposerQueue: GetProposerResponse
    // block
    entries: LogEntryAggregate[]
    constructor(termId: i64, proposerId: i32, proposerQueue: GetProposerResponse, entries: LogEntryAggregate[]) {
        this.termId = termId;
        this.proposerId = proposerId;
        this.proposerQueue = proposerQueue;
        this.entries = entries;
    }
}

// @ts-ignore
@serializable
export class AppendEntryResponse {
    // currentTerm, for leader to update itself
    termId: i64;
    // true if follower contained entry matching prevLogIndex and prevLogTerm
    success: bool;
    lastIndex: i64;
    constructor(termId: i64, success: bool, lastIndex: i64) {
        this.termId = termId;
        this.success = success;
        this.lastIndex = lastIndex;
    }
}

// @ts-ignore
@serializable
export class UpdateNodeRequest {
    peer_address: string
    constructor(peer_address: string) {
        this.peer_address = peer_address;
    }
}

// @ts-ignore
@serializable
export class NodeInfoRequest {
    peer_address: string
    constructor(peer_address: string) {
        this.peer_address = peer_address;
    }
}

// @ts-ignore
@serializable
export class QueryBuildGenTxRequest {
    chainId: string
    msg: stakingtypes.MsgCreateValidator
    constructor(chainId: string, msg: stakingtypes.MsgCreateValidator) {
        this.chainId = chainId
        this.msg = msg
    }
}

// @ts-ignore
@serializable
export class IsNodeValidator {
    isvalidator: boolean
    nodeIndex: i32
    constructor(isvalidator: boolean, nodeIndex: i32) {
        this.isvalidator = isvalidator
        this.nodeIndex = nodeIndex
    }
}

// @ts-ignore
@serializable
export class CosmosmodGenesisState {
    staking: stakingtypes.GenesisState
    constructor(staking: stakingtypes.GenesisState) {
        this.staking = staking
    }
}

// @ts-ignore
@serializable
export class UpdateNodeResponse {
    nodes: NodeInfo[]
    sync_node_id: i32
    last_entry_index: i64
    proposerQueue: ValidatorQueueEntry[] = []
    proposerQueueTermId: i64 = 0
    proposerIndex: i32 = 0
    constructor(
        nodes: NodeInfo[],
        sync_node_id: i32,
        last_entry_index: i64,
        proposerQueue: ValidatorQueueEntry[],
        proposerQueueTermId: i64,
        proposerIndex: i32,
    ) {
        this.nodes = nodes
        this.sync_node_id = sync_node_id
        this.last_entry_index = last_entry_index
        this.proposerQueue = proposerQueue
        this.proposerQueueTermId = proposerQueueTermId
        this.proposerIndex = proposerIndex
    }
}
