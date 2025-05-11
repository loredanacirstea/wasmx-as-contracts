import { JSON } from "json-as";
import * as wblocks from "wasmx-blocks/assembly/types";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { Base64String, Bech32String, Coin } from "wasmx-env/assembly/types";
import { NodeInfo } from "wasmx-p2p/assembly/types";
import { GetProposerResponse } from "./types_blockchain";

export const MODULE_NAME = "tendermint"

@json
export class LogEntry {
    // this is also the block height
    index: i64;
    termId: i32;
    leaderId: i32;
    data: Base64String; // empty for finalized blocks;
    constructor(index: i64, termId: i32, leaderId: i32, data: string) {
        this.index = index;
        this.termId = termId;
        this.leaderId = leaderId;
        this.data = data;
    }
}

@json
export class LogEntryAggregate {
    // this is also the block height
    index: i64;
    termId: i32;
    leaderId: i32;
    data: wblocks.BlockEntry;
    constructor(index: i64, termId: i32, leaderId: i32, data: wblocks.BlockEntry) {
        this.index = index;
        this.termId = termId;
        this.leaderId = leaderId;
        this.data = data;
    }
}

@json
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

@json
export class TransactionResponse {
    termId: i32;
    leaderId: i32;
    index: i64;
    constructor(termId: i32, leaderId: i32, index: i64) {
        this.termId = termId;
        this.leaderId = leaderId;
        this.index = index;
    }
}

@json
export class AppendEntry {
    // leader’s term
    termId: i32;
    // so follower can redirect clients
    proposerId: i32;
    // we set this for the current state, to only be used in force proposal reset
    proposerQueue: GetProposerResponse
    // block
    entries: LogEntryAggregate[]
    nodeIps: Array<NodeInfo>;
    constructor(termId: i32, proposerId: i32, proposerQueue: GetProposerResponse, entries: LogEntryAggregate[], nodeIps: Array<NodeInfo>) {
        this.termId = termId;
        this.proposerId = proposerId;
        this.proposerQueue = proposerQueue;
        this.entries = entries;
        this.nodeIps = nodeIps;
    }
}

@json
export class AppendEntryResponse {
    // currentTerm, for leader to update itself
    termId: i32;
    // true if follower contained entry matching prevLogIndex and prevLogTerm
    success: bool;
    lastIndex: i64;
    constructor(termId: i32, success: bool, lastIndex: i64) {
        this.termId = termId;
        this.success = success;
        this.lastIndex = lastIndex;
    }
}

@json
export class Precommit {
    // leader’s term
    termId: i32;
    // so follower can redirect clients
    proposerId: i32;
    // block
    index: i64
    constructor(termId: i32, proposerId: i32, index: i64) {
        this.termId = termId;
        this.proposerId = proposerId;
        this.index = index;
    }
}

@json
export class BuildProposal {
    entry: LogEntryAggregate
    proposal: typestnd.RequestProcessProposal
    constructor(entry: LogEntryAggregate, proposal: typestnd.RequestProcessProposal) {
        this.entry = entry
        this.proposal = proposal
    }
}
