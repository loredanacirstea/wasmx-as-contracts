import { JSON } from "json-as/assembly";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import { LogEntryAggregate } from "./types";

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
