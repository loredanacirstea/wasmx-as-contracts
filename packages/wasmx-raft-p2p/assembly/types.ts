import { JSON } from "json-as";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import { LogEntryAggregate } from "wasmx-raft/assembly/types_raft";

export const MODULE_NAME = "raftp2p"

export const PROTOCOL_ID = "raftp2p_1"

@json
export class StateSyncRequest {
  start_index: i64
  constructor(start_index: i64) {
    this.start_index = start_index
  }
}

@json
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
