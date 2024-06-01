import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as base64 from "as-base64/assembly"
import { CallData, getCallDataCrossChain, getCallDataWrap } from "./calldata";
import { get, set } from "./actions";
import { LoggerInfo, revert } from "./utils";
import { WasmxExecutionMessage } from "wasmx-env/assembly/types";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  const calld = getCallDataWrap();
  const result = mainInternal(calld);
  wasmx.finish(result);
}

export function mainInternal(calld: CallData): ArrayBuffer {
  let result: ArrayBuffer = new ArrayBuffer(0)
  if (calld.set !== null) {
    set(calld.set!);
  } else if (calld.get !== null) {
    result = get(calld.get!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  return result;
}

export function crosschain(): void{
  const calld = getCallDataCrossChain();
  LoggerInfo("crosschain request", ["from_chain_id", calld.from_chain_id, "from", calld.from, "from_role", calld.from_role])

  const calldstr = String.UTF8.decode(base64.decode(calld.msg).buffer)
  const execmsg = JSON.parse<WasmxExecutionMessage>(calldstr);
  const execmsgstr = String.UTF8.decode(base64.decode(execmsg.data).buffer)
  const msg = JSON.parse<CallData>(execmsgstr);
  const result = mainInternal(msg);
  wasmx.finish(result);
}

