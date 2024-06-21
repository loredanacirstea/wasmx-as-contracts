import { JSON } from "json-as/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { MsgGet, MsgSet } from "./types";
import { LoggerDebug } from "./utils";

export function set(req: MsgSet): void {
  LoggerDebug("set", ["key", req.key, "value", req.value])
  wasmxw.sstore(req.key, req.value);
}

export function get(req: MsgGet): ArrayBuffer {
  const resp = wasmxw.sload(req.key)
  LoggerDebug("get", ["key", req.key, "value", resp])
  return String.UTF8.encode(resp);
}

export function testGetWithStore(req: MsgGet): ArrayBuffer {
  const val = wasmxw.sload(req.key)
  wasmxw.sstore(req.key, val + "a");
  LoggerDebug("testGetWithStore", ["key", req.key, "value", val + "a"])
  return String.UTF8.encode(val);
}
