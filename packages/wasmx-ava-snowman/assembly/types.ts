import { JSON } from "json-as/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "avasnow"

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
export class AppendEntry {
    // leader’s term
    termId: i32;
    // so follower can redirect clients
    proposerId: i32;
    // block
    entries: LogEntryAggregate[]
    nodeIps: Array<NodeInfo>;
    validators: Base64String;
    constructor(termId: i32, proposerId: i32, entries: LogEntryAggregate[], nodeIps: Array<NodeInfo>, validators: Base64String) {
        this.termId = termId;
        this.proposerId = proposerId;
        this.entries = entries;
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
    constructor(termId: i32, success: bool) {
        this.termId = termId;
        this.success = success;
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
  nodeIPs: NodeInfo[]
  nodeId: i32
  validators: Base64String
  constructor(nodeIPs: NodeInfo[], nodeId: i32, validators: Base64String) {
    this.nodeIPs = nodeIPs
    this.nodeId = nodeId
    this.validators = validators
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

// @ts-ignore
@serializable
export class TempBlock {
    block: Base64String
    header: Base64String
    hash: string
    constructor(block: Base64String, header: Base64String, hash: string) {
        this.block = block
        this.header = header
        this.hash = hash
    }
}

// @ts-ignore
@serializable
export class QueryResponse {
    block: Base64String
    header: Base64String
    constructor(block: Base64String, header: Base64String) {
        this.block = block
        this.header = header
    }
}

// @ts-ignore
@serializable
export class NodeInfo {
    address: Bech32String
    ip: string
    constructor(address: Bech32String, ip: string) {
        this.address = address
        this.ip = ip
    }
}
