import { JSON } from "json-as/assembly";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import { LogEntryAggregate } from "./types";
import { NodeInfo } from "wasmx-p2p/assembly/types";

// @ts-ignore
@serializable
export class StateSyncRequest {
  start_index: i64
  peer_address: string
  constructor(start_index: i64, peer_address: string) {
    this.start_index = start_index
    this.peer_address = peer_address
  }
}

// @ts-ignore
@serializable
export class StateSyncResponse {
  start_batch_index: i64
  last_batch_index: i64
  last_log_index: i64
  termId: i32
  entries: Array<LogEntryAggregate>
  constructor(start_batch_index: i64, last_batch_index: i64, last_log_index: i64, termId: i32, entries: Array<LogEntryAggregate>) {
    this.start_batch_index = start_batch_index
    this.last_batch_index = last_batch_index
    this.entries = entries;
    this.last_log_index = last_log_index
    this.termId = termId
  }
}

// @ts-ignore
@serializable
export class NodesSyncResponse {
  nodes: Array<NodeInfo>
  constructor(nodes: Array<NodeInfo>) {
    this.nodes = nodes
  }
}
