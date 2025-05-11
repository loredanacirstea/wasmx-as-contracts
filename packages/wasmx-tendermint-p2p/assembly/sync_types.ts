import { JSON } from "json-as";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import { LogEntryAggregate } from "./types";
import { NodeInfo } from "wasmx-p2p/assembly/types";

@json
export class StateSyncRequest {
  start_index: i64
  peer_address: string
  constructor(start_index: i64, peer_address: string) {
    this.start_index = start_index
    this.peer_address = peer_address
  }
}

@json
export class StateSyncResponse {
  start_batch_index: i64
  last_batch_index: i64
  last_log_index: i64 // RECENT_HEIGHT
  trusted_log_index: i64 // TRUST_HEIGHT
  trusted_log_hash: Base64String // TRUST_HASH
  termId: i32
  peer_address: string
  entries: Array<LogEntryAggregate>
  constructor(start_batch_index: i64, last_batch_index: i64, last_log_index: i64, trusted_log_index: i64, trusted_log_hash: Base64String, termId: i32, peer_address: string, entries: Array<LogEntryAggregate>) {
    this.start_batch_index = start_batch_index
    this.last_batch_index = last_batch_index
    this.entries = entries;
    this.last_log_index = last_log_index
    this.trusted_log_index = trusted_log_index
    this.trusted_log_hash = trusted_log_hash
    this.termId = termId
    this.peer_address = peer_address
  }
}

@json
export class NodesSyncResponse {
  nodes: Array<NodeInfo>
  constructor(nodes: Array<NodeInfo>) {
    this.nodes = nodes
  }
}
