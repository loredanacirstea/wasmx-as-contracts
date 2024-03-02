import { JSON } from "json-as/assembly";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import { Peer } from "wasmx-p2p/assembly/types_p2p";
import { AppendEntry, LogEntryAggregate } from "wasmx-raft/assembly/types_raft";

export const MODULE_NAME = "raftp2p"

export const PROTOCOL_ID = "raftp2p_1"


// @ts-ignore
@serializable
export class MsgP2PReceived {
  sender: string // peerId
  msg: Base64String
  constructor(sender: string, msg: Base64String) {
    this.sender = sender
    this.msg = msg
  }
}

// @ts-ignore
@serializable
export class StateSyncRequest {
  start_index: i64
  constructor(start_index: i64) {
    this.start_index = start_index
  }
}

// @ts-ignore
@serializable
export class StateSyncResponse {
  entries: LogEntryAggregate[]
  last_log_index: i64
  termId: i32
  constructor(entries: LogEntryAggregate[], last_log_index: i64, termId: i32) {
    this.entries = entries;
    this.last_log_index = last_log_index
    this.termId = termId
  }
}
