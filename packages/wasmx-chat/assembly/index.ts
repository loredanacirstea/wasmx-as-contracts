import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { base64ToString } from "wasmx-utils/assembly/utils";
import { Base64String, TxMessage, WasmxExecutionMessage } from "wasmx-env/assembly/types";
import { decode as base64decode } from "as-base64/assembly"
import { CallData, CallDataInternal, getCallDataInternal, getCallDataWrap } from './calldata';
import * as actions from "./actions";
import { LoggerInfo, revert } from "./utils";
import { MODULE_NAME, MsgReceiveMessage } from "./types";

export function wasmx_env_2(): void {}

export function wasmx_p2p_1(): void {}

export function instantiate(): void {}

// we receive encoded transactions
export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap()
  if (calld.HandleTx != null) {
    handleTx(calld.HandleTx!);
  } else if (calld.StartNode !== null) {
    StartNode();
  } else if (calld.GetRooms !== null) {
    result = actions.GetRooms();
  } else if (calld.GetMessages !== null) {
    result = actions.GetMessages(calld.GetMessages!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

export function StartNode(): void {
  LoggerInfo("start", ["module", MODULE_NAME])
  actions.start()
}

export function p2pmsg(): void {
  const calldraw = wasmx.getCallData();
  let calldstr = String.UTF8.decode(calldraw)
  const req = JSON.parse<MsgReceiveMessage>(calldstr);
  req.message = base64ToString(req.message);
  actions.receiveMessage(req);
}

function handleTx(tx: Base64String): void {
  const decoded = wasmxw.decodeCosmosTxToJson(base64decode(tx).buffer);
  if (decoded.body.messages.length == 0) return;
  const msg = decoded.body.messages[0]
  if (msg.contract != wasmxw.getAddress()) {
    revert(`${MODULE_NAME} cannot handle tx sent to ${msg.contract}`);
  }
  const calld = getCallDataInternal(base64ToString(msg.msg.data));
  handleMessage(msg, calld);
}

function handleMessage(ctx: TxMessage, calld: CallDataInternal): void {
  if (calld.SendMessage !== null) {
    actions.sendMessage(ctx, calld.SendMessage!);
  } else if (calld.JoinRoom !== null) {
    actions.joinRoom(ctx, calld.JoinRoom!);
  } else if (calld.ReceiveMessage !== null) {
    actions.receiveMessage(calld.ReceiveMessage!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
}
