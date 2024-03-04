import { JSON } from "json-as/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import { Base64String, Bech32String, Coin } from "wasmx-env/assembly/types";

export const MODULE_NAME = "raft"

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
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
    termId: i32;
    leaderId: i32;
    index: i64;
    constructor(termId: i32, leaderId: i32, index: i64) {
        this.termId = termId;
        this.leaderId = leaderId;
        this.index = index;
    }
}

// @ts-ignore
@serializable
export class AppendEntry {
    // leader’s term
    termId: i32;
    // so follower can redirect clients
    leaderId: i32;
    // index of log entry immediately preceding new ones
    prevLogIndex: i64;
    // term of prevLogIndex entry
    prevLogTerm: i32;
    // log entries to store (empty for heartbeat; may send more than one for efficiency)
    entries: Array<LogEntryAggregate>
    // leader’s commitIndex
    leaderCommit: i64;
    nodeIps: Array<NodeInfo>;
    validators: Base64String;
    constructor(termId: i32, leaderId: i32, prevLogIndex: i64, prevLogTerm: i32, entries: Array<LogEntryAggregate>, leaderCommit: i64, nodeIps: Array<NodeInfo>, validators: Base64String) {
        this.termId = termId;
        this.leaderId = leaderId;
        this.prevLogIndex = prevLogIndex;
        this.prevLogTerm = prevLogTerm;
        this.entries = entries;
        this.leaderCommit = leaderCommit;
        this.nodeIps = nodeIps;
        this.validators = validators;
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class VoteRequest {
    termId: i32;
    candidateId: i32;
    lastLogIndex: i64;
    lastLogTerm: i32;
    constructor(termId: i32, candidateId: i32, lastLogIndex: i64, lastLogTerm: i32) {
        this.termId = termId;
        this.candidateId = candidateId;
        this.lastLogIndex = lastLogIndex;
        this.lastLogTerm = lastLogTerm;
    }
}

// @ts-ignore
@serializable
export class NodeUpdate {
    node: NodeInfo;
    index: i32;
    type: i32; // removed = 0; added = 1; updated = 2;
    constructor(node: NodeInfo, index: i32, type: i32) {
        this.node = node;
        this.index = index;
        this.type = type;
    }
}

// @ts-ignore
@serializable
export class UpdateNodeResponse {
  nodes: NodeInfo[]
  sync_node_id: i32
  last_entry_index: i64
  constructor(nodes: NodeInfo[], sync_node_id: i32, last_entry_index: i64) {
    this.nodes = nodes
    this.sync_node_id = sync_node_id
    this.last_entry_index = last_entry_index
  }
}

// @ts-ignore
@serializable
export class VoteResponse {
    termId: i32;
    voteGranted: bool;
    constructor(termId: i32, voteGranted: bool) {
        this.termId = termId;
        this.voteGranted = voteGranted;
    }
}

// @ts-ignore
@serializable
export class Node {
  id: Base64String
  host: string
  port: string
  ip: string // can be empty if host & port are used
  constructor(id: Base64String, host: string, port: string, ip: string) {
    this.id = id
    this.host = host
    this.port = port
    this.ip = ip
  }
}

// @ts-ignore
@serializable
export class NodeInfo {
    address: Bech32String
    node: Node
    outofsync: bool
    constructor(address: Bech32String, node: Node, outofsync: bool) {
        this.address = address
        this.node = node
        this.outofsync = outofsync
    }
}
