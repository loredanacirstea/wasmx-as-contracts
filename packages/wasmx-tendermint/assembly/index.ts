import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import * as actions from "./actions";
import { revert } from "./utils";
import { onlyInternal } from "wasmx-env/assembly/utils";
import { MODULE_NAME } from "./types";

export function memory_assemblyscript_1(): void {}

export function wasmx_env_i32_2(): void {}

export function wasmx_env_core_i32_1(): void {}

export function wasmx_crosschain_1(): void {}

export function wasmx_consensus_json_1(): void {}

export function instantiate(): void {}

export function main(): void {
  onlyInternal(MODULE_NAME, "");

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
  } else if (calld.method === "ifNewTransaction") {
    result = actions.wrapGuard(actions.ifNewTransaction(calld.params, calld.event));
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
    actions.setupNode(calld.params, calld.event);
  } else if (calld.method === "processBlock") {
    actions.processBlock(calld.params, calld.event);
  } else if (calld.method === "addToMempool") {
    actions.addToMempool(calld.params, calld.event);
  } else if (calld.method === "commitBlocks") {
    actions.commitBlocks(calld.params, calld.event);
  } else if (calld.method === "commitBlock") {
    actions.commitBlock(calld.params, calld.event);
  } else if (calld.method === "sendProposalResponse") {
    actions.sendProposalResponse(calld.params, calld.event);
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
  }
  else {
    revert(`invalid function call data: ${calld.method}`);
  }
  // we may have set the return data during execution
  result = wasmx.getFinishData();
  wasmx.finish(result);
}
