import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from 'wasmx-tendermint/assembly/calldata';
import * as actions from "wasmx-tendermint/assembly/actions";
import * as raftp2p from "wasmx-raft-p2p/assembly/actions";
import { revert } from "./utils";
import { commitBlocks, forwardTx, receiveStateSyncRequest, receiveStateSyncResponse, sendProposalResponse, setupNode } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const calld = getCallDataWrap();
  if (calld.method === "isNextProposer") {
    result = actions.wrapGuard(actions.isNextProposer(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifPrevoteThreshold") {
    result = actions.wrapGuard(actions.ifPrevoteThreshold(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifPrecommitThreshold") {
    result = actions.wrapGuard(actions.ifPrecommitThreshold(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "sendPrevoteResponse") {
    actions.sendPrevoteResponse(calld.params, calld.event);
  } else if (calld.method === "sendPrecommitResponse") {
    actions.sendPrecommitResponse(calld.params, calld.event);
  } else if (calld.method === "proposeBlock") {
    actions.proposeBlock(calld.params, calld.event);
  } else if (calld.method === "precommitState") {
    actions.precommitState(calld.params, calld.event);
  } else if (calld.method === "commit") {
    actions.commit(calld.params, calld.event);
  } else if (calld.method === "setupNode") {
    setupNode(calld.params, calld.event);
  } else if (calld.method === "processBlock") {
    actions.processBlock(calld.params, calld.event);
  } else if (calld.method === "addToMempool") {
    actions.addToMempool(calld.params, calld.event);
  } else if (calld.method === "commitBlocks") {
    commitBlocks(calld.params, calld.event);
  } else if (calld.method === "receiveAppendEntryResponse") {
    raftp2p.receiveAppendEntryResponse(calld.params, calld.event);
  } else if (calld.method === "commitBlock") {
    actions.commitBlock(calld.params, calld.event);
  } else if (calld.method === "sendProposalResponse") {
    sendProposalResponse(calld.params, calld.event);
  } else if (calld.method === "sendNewTransactionResponse") {
    actions.sendNewTransactionResponse(calld.params, calld.event);
  } else if (calld.method === "incrementCurrentTerm") {
    actions.incrementCurrentTerm(calld.params, calld.event);
  } else if (calld.method === "sendAppendEntries") {
    actions.sendAppendEntries(calld.params, calld.event);
  } else if (calld.method === "updateNodeAndReturn") {
    actions.updateNodeAndReturn(calld.params, calld.event);
  } else if (calld.method === "registeredCheck") {
    actions.registeredCheck(calld.params, calld.event);
  } else if (calld.method === "proposeBlock") {
    actions.proposeBlock(calld.params, calld.event);
  } else if (calld.method === "initializeNextIndex") {
    actions.initializeNextIndex(calld.params, calld.event);
  } else if (calld.method === "setup") {
    actions.setup(calld.params, calld.event);
  } else if (calld.method === "forwardTx") {
    forwardTx(calld.params, calld.event);
  } else if (calld.method === "connectPeers") {
    raftp2p.connectPeers(calld.params, calld.event);
  } else if (calld.method === "requestNetworkSync") {
    raftp2p.requestNetworkSync(calld.params, calld.event);
  } else if (calld.method === "receiveStateSyncRequest") {
    receiveStateSyncRequest(calld.params, calld.event);
  } else if (calld.method === "receiveStateSyncResponse") {
    receiveStateSyncResponse(calld.params, calld.event);
  } else if (calld.method === "receiveUpdateNodeResponse") {
    raftp2p.receiveUpdateNodeResponse(calld.params, calld.event);
  }
  else {
    revert(`invalid function call data: ${calld.method}`);
  }
  // we may have set the return data during execution
  result = wasmx.getFinishData();
  wasmx.finish(result);
}

// sendPrecommitResponse - TODO?
