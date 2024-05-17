import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmxt from "wasmx-env/assembly/wasmx_types";
import { base64ToString } from "wasmx-utils/assembly/utils";
import { Base64String, TxMessage, WasmxExecutionMessage } from "wasmx-env/assembly/types";
import { CallDataInternal, getCallDataInternal, getCallDataWrap } from './calldata';
import * as actions from "./actions";
import { LoggerInfo, revert } from "./utils";
import { ChatBlock, MODULE_NAME, MsgReceiveMessage } from "./types";
import { parseTx } from "./block";

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
  } else if (calld.GetBlocks !== null) {
    result = actions.GetBlocks(calld.GetBlocks!);
  } else if (calld.GetBlock !== null) {
    result = actions.GetBlock(calld.GetBlock!);
  } else if (calld.GetMessage !== null) {
    result = actions.GetMessage(calld.GetMessage!);
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
  const block = JSON.parse<ChatBlock>(req.message)
  const ctx = parseTx(block.data);
  if (!ctx) return;
  // verify tx signature
  const resp = wasmxw.verifyCosmosTx(block.data)
  if (!resp.valid) {
    revert(`invalid transaction signature: ${resp.error}`);
  }
  const calld = getCallDataInternal(base64ToString(ctx.msg.data));
  actions.receiveMessage(ctx, block, req, calld);
}

function handleTx(tx: Base64String): void {
  const msg = parseTx(tx);
  if (!msg) return;
  const calld = getCallDataInternal(base64ToString(msg.msg.data));
  handleMessage(msg, tx, calld);
}

function handleMessage(ctx: wasmxt.MsgExecuteContract, tx: Base64String, calld: CallDataInternal): void {
  if (calld.SendMessage !== null) {
    actions.sendMessage(ctx, tx, calld.SendMessage!);
  } else if (calld.JoinRoom !== null) {
    actions.joinRoom(ctx, tx, calld.JoinRoom!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
}
