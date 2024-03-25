import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { base64ToString } from "wasmx-utils/assembly/utils";
import { Base64String, TxMessage, WasmxExecutionMessage } from "wasmx-env/assembly/types";
import { getCallDataWrap } from './calldata';
import * as actions from "./actions";
import { LoggerInfo, revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

// we receive encoded transactions
export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap()
  if (calld.StoreConversation != null) {
    actions.storeConversation(calld.StoreConversation!);
  } else if (calld.VerifyConversation !== null) {
    result = actions.verifyConversation(calld.VerifyConversation!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

