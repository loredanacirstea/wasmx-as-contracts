import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import * as actions from "./actions";
import { LoggerInfo, revert } from "./utils";
import { MODULE_NAME, MsgReceiveMessage } from "./types";

export function wasmx_env_2(): void {}

export function wasmx_p2p_1(): void {}

export function instantiate(): void {}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  // if (calld.CreateRoom !== null) {
  //   actions.createRoom(calld.CreateRoom!);
  // } else
  if (calld.SendMessage !== null) {
    actions.sendMessage(calld.SendMessage!);
  } else if (calld.JoinRoom !== null) {
    actions.joinRoom(calld.JoinRoom!);
  } else if (calld.ReceiveMessage !== null) {
    actions.receiveMessage(calld.ReceiveMessage!);
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
  actions.receiveMessage(req);
}
