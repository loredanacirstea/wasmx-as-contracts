import { JSON } from "json-as";
import * as wasmxt from "wasmx-env/assembly/types";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { MODULE_NAME, MsgGet, MsgSet } from "./types";
import { LoggerDebug, revert } from "./utils";
import { callContract } from "wasmx-env/assembly/utils";
import { parseInt32, stringToBase64 } from "wasmx-utils/assembly/utils";

const VAR_KEY = "somevar"
export const CROSS_CHAIN_CONTRACT_KEY = "crosschain_contract"

export function increment(): void {
  let value = 0;
  const val = wasmxw.sload(VAR_KEY);
  if (val == "") {
    value = parseInt32(val);
  }
  value += 1;

  LoggerDebug("set", ["key", VAR_KEY, "value", value.toString()])
  wasmxw.sstore(VAR_KEY, value.toString());
}

export function incrementAndCall(fromChain: string, from: wasmxt.Bech32String): void {
  increment();
  const msg = `{"CrossChain":{"sender":"","from":"","to":"${wasmxw.getAddress()}","msg":"${stringToBase64(`{"data":"${stringToBase64(`{"increment":{}}`)}"}`)}","funds":[],"dependencies":[],"from_chain_id":"","to_chain_id":"${wasmxw.getChainId()}","is_query":false}}`;
  const req = new wasmxt.MsgCrossChainCallRequest(
    from,
    stringToBase64(`{"data":"${stringToBase64(msg)}"}`),
    [],
    [],
    fromChain,
  )
  crossChainTx(req);
}

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

export function crossChainTx(req: wasmxt.MsgCrossChainCallRequest): wasmxt.MsgCrossChainCallResponse {
  const reqstr = JSON.stringify<wasmxt.MsgCrossChainCallRequest>(req)
  const calldatastr = `{"CrossChainTx":${reqstr}}`;
  const resp = callContract(getCrossChainContract(), calldatastr, false, MODULE_NAME)
  if (resp.success > 0) {
      revert(`multichain crosschain tx failed: ${resp.data}`)
  }
  return JSON.parse<wasmxt.MsgCrossChainCallResponse>(resp.data)
}

export function getCrossChainContract(): wasmxt.Bech32String {
  return wasmxw.sload(CROSS_CHAIN_CONTRACT_KEY);
}

export function setCrossChainContract(addr: wasmxt.Bech32String): void {
  return wasmxw.sstore(CROSS_CHAIN_CONTRACT_KEY, addr);
}
