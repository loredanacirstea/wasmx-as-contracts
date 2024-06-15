import { JSON } from "json-as/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx"
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { MsgGet, MsgSet } from "./types";

export function set(req: MsgSet): void {
    wasmxw.sstore(req.key, req.value);
}

export function get(req: MsgGet): ArrayBuffer {
  const resp = wasmxw.sload(req.key)
  return String.UTF8.encode(resp);
}

export function testGetWithStore(req: MsgGet): ArrayBuffer {
  const val = wasmxw.sload(req.key)
  wasmxw.sstore(req.key, val + "a");
  return String.UTF8.encode(val);
}
