import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
// import * as tnd2 from "wasmx-tendermint-p2p/assembly/actions";
import { getCallDataWrap } from './calldata';
import { revert } from "./utils";
import * as actions from "./actions";
import { wrapGuard } from "./actions";

export function wasmx_env_2(): void {}

export function wasmx_p2p_1(): void {}

export function wasmx_multichain_1(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.method === "ifValidatorThreshold") {
    result = wrapGuard(actions.ifValidatorThreshold(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifGenesisDataComplete") {
    result = wrapGuard(actions.ifGenesisDataComplete(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifLobbyDisconnect") {
    result = wrapGuard(actions.ifLobbyDisconnect(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "setupNode") {
    actions.setupNode(calld.params, calld.event);
  } else if (calld.method === "p2pConnectLobbyRoom") {
    actions.p2pConnectLobbyRoom(calld.params, calld.event);
  } else if (calld.method === "p2pConnectNewChainRoom") {
    actions.p2pConnectNewChainRoom(calld.params, calld.event);
  } else if (calld.method === "p2pDisconnectLobbyRoom") {
    actions.p2pDisconnectLobbyRoom(calld.params, calld.event);
  } else if (calld.method === "p2pDisconnectNewChainRoom") {
    actions.p2pDisconnectNewChainRoom(calld.params, calld.event);
  } else if (calld.method === "sendNewChainRequest") {
    actions.sendNewChainRequest(calld.params, calld.event);
  } else if (calld.method === "sendNewChainResponse") {
    actions.sendNewChainResponse(calld.params, calld.event);
  } else if (calld.method === "sendLastChainId") {
    actions.sendLastChainId(calld.params, calld.event);
  } else if (calld.method === "sendLastNodeId") {
    actions.sendLastNodeId(calld.params, calld.event);
  } else if (calld.method === "receiveLastChainId") {
    actions.receiveLastChainId(calld.params, calld.event);
  } else if (calld.method === "receiveLastNodeId") {
    actions.receiveLastNodeId(calld.params, calld.event);
  } else if (calld.method === "receiveNewChainRequest") {
    actions.receiveNewChainRequest(calld.params, calld.event);
  } else if (calld.method === "receiveNewChainResponse") {
    actions.receiveNewChainResponse(calld.params, calld.event);
  } else if (calld.method === "tryCreateNewChainGenesisData") {
    actions.tryCreateNewChainGenesisData(calld.params, calld.event);
  } else if (calld.method === "receiveNewChainGenesisData") {
    actions.receiveNewChainGenesisData(calld.params, calld.event);
  } else if (calld.method === "initializeChain") {
    actions.initializeChain(calld.params, calld.event);
  } else if (calld.method === "addGenTx") {
    actions.addGenTx(calld.params, calld.event);
  } else if (calld.method === "buildGenTx") {
    actions.buildGenTx(calld.params, calld.event);
    wasmx.finish(wasmx.getFinishData());
    return;
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
