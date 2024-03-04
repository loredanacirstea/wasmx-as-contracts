import { JSON } from "json-as/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import { LogEntryAggregate } from "wasmx-tendermint/assembly/types";

export const MODULE_NAME = "tendermintp2p"

export const PROTOCOL_ID = "tendermintp2p_1"

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
