import { JSON } from "json-as/assembly";
import * as wasmx from './wasmx';
import { getCallDataWrap } from './calldata';
import * as actions from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer;
  const calld = getCallDataWrap();
  if (calld.method === "isVotedLeader") {
    result = actions.wrapGuard(actions.isVotedLeader(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "setupNode") {
    actions.setupNode(calld.params, calld.event);
  } else if (calld.method === "processAppendEntries") {
    actions.processAppendEntries(calld.params, calld.event);
  } else if (calld.method === "sendHeartbeatResponse") {
    actions.sendHeartbeatResponse(calld.params, calld.event);
  } else if (calld.method === "sendAppendEntries") {
    actions.sendAppendEntries(calld.params, calld.event);
  } else if (calld.method === "sendNewTransactionResponse") {
    actions.sendNewTransactionResponse(calld.params, calld.event);
  } else if (calld.method === "addToMempool") {
    actions.addToMempool(calld.params, calld.event);
  } else if (calld.method === "commitBlocks") {
    actions.commitBlocks(calld.params, calld.event);
  } else if (calld.method === "setRandomElectionTimeout") {
    actions.setRandomElectionTimeout(calld.params, calld.event);
  } else if (calld.method === "initializeNextIndex") {
    actions.initializeNextIndex(calld.params, calld.event);
  } else if (calld.method === "initializeMatchIndex") {
    actions.initializeMatchIndex(calld.params, calld.event);
  } else if (calld.method === "incrementCurrentTerm") {
    actions.incrementCurrentTerm(calld.params, calld.event);
  } else if (calld.method === "vote") {
    actions.vote(calld.params, calld.event);
  } else if (calld.method === "selfVote") {
    actions.selfVote(calld.params, calld.event);
  } else if (calld.method === "forwardTxsToLeader") {
    actions.forwardTxsToLeader(calld.params, calld.event);
  } else if (calld.method === "updateNodeAndReturn") {
    actions.updateNodeAndReturn(calld.params, calld.event);
  } else if (calld.method === "registeredCheck") {
    actions.registeredCheck(calld.params, calld.event);
  } else {
    wasmx.revert(String.UTF8.encode("invalid function call data"));
    throw new Error("invalid function call data");
  }
  wasmx.finish(new ArrayBuffer(0));
}
