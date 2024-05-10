import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import * as tnd from "wasmx-tendermint/assembly/actions";
import { revert } from "./utils";
import * as actions from "./actions";
import { wrapGuard } from "./actions";

export function wasmx_env_2(): void {}

export function wasmx_multichain_1(): void {}

export function instantiate(): void {
  // const calld = getCallDataInitialize()
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.method === "ifEnoughMembers") {
    result = wrapGuard(actions.ifEnoughMembers(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "newBlock") {
    actions.newBlock(calld.params, calld.event);
  } else if (calld.method === "sendNewTransactionResponse") {
    tnd.sendNewTransactionResponse(calld.params, calld.event);
  } else if (calld.method === "addToMempool") {
    tnd.addToMempool(calld.params, calld.event);
  } else if (calld.method === "setupNode") {
    actions.setupNode(calld.params, calld.event);
  } else if (calld.method === "setup") {
    actions.setup(calld.params, calld.event);
  } else if (calld.method === "StartNode") {
    actions.StartNode();
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
