import { JSON } from "json-as/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { MsgGet, MsgSet } from "./types";

export function set(req: MsgSet): void {
    wasmxw.sstore(req.key, req.value);
}

export function get(req: MsgGet): ArrayBuffer {
  const resp = wasmxw.sload(req.key)
  return String.UTF8.encode(resp);
}
