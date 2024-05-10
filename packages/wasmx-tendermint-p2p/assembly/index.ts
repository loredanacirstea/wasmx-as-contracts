import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from 'wasmx-tendermint/assembly/calldata';
import * as tnd from "wasmx-tendermint/assembly/actions";
import * as raftp2p from "wasmx-raft-p2p/assembly/actions";
import * as actions from "./actions";
import { wrapGuard } from "./action_utils";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function wasmx_p2p_1(): void {}

export function wasmx_multichain_1(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const calld = getCallDataWrap();
  if (calld.method === "isNextProposer") {
    result = wrapGuard(actions.isNextProposer(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifPrevoteAnyThreshold") {
    result = wrapGuard(actions.ifPrevoteAnyThreshold(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifPrevoteAcceptThreshold") {
    result = wrapGuard(actions.ifPrevoteAcceptThreshold(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifPrecommitAnyThreshold") {
    result = wrapGuard(actions.ifPrecommitAnyThreshold(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifPrecommitAcceptThreshold") {
    result = wrapGuard(actions.ifPrecommitAcceptThreshold(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifSenderIsProposer") {
    result = wrapGuard(actions.ifSenderIsProposer(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifNodeIsValidator") {
    result = wrapGuard(actions.ifNodeIsValidator(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "newValidatorIsSelf") {
    result = wrapGuard(actions.newValidatorIsSelf(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "setRoundProposer") {
    actions.setRoundProposer(calld.params, calld.event);
  } else if (calld.method === "sendBlockProposal") {
    actions.sendBlockProposal(calld.params, calld.event);
  } else if (calld.method === "sendPrevote") {
    actions.sendPrevote(calld.params, calld.event);
  } else if (calld.method === "sendPrecommit") {
    actions.sendPrecommit(calld.params, calld.event);
  } else if (calld.method === "sendPrevoteNil") {
    actions.sendPrevoteNil(calld.params, calld.event);
  } else if (calld.method === "sendPrecommitNil") {
    actions.sendPrecommitNil(calld.params, calld.event);
  } else if (calld.method === "setupNode") {
    actions.setupNode(calld.params, calld.event);
  } else if (calld.method === "addToMempool") {
    tnd.addToMempool(calld.params, calld.event);
  } else if (calld.method === "commitBlock") {
    actions.commitBlock(calld.params, calld.event);
  } else if (calld.method === "sendNewTransactionResponse") {
    tnd.sendNewTransactionResponse(calld.params, calld.event);
  } else if (calld.method === "incrementCurrentTerm") {
    tnd.incrementCurrentTerm(calld.params, calld.event);
  } else if (calld.method === "updateNodeAndReturn") {
    actions.updateNodeAndReturn(calld.params, calld.event);
  } else if (calld.method === "proposeBlock") {
    actions.proposeBlock(calld.params, calld.event);
  } else if (calld.method === "resetPrevotes") {
    actions.resetPrevotes(calld.params, calld.event);
  } else if (calld.method === "resetPrecommits") {
    actions.resetPrecommits(calld.params, calld.event);
  } else if (calld.method === "setLockedValue") {
    actions.setLockedValue(calld.params, calld.event);
  } else if (calld.method === "setLockedRound") {
    actions.setLockedRound(calld.params, calld.event);
  } else if (calld.method === "setValidValue") {
    actions.setValidValue(calld.params, calld.event);
  } else if (calld.method === "setValidRound") {
    actions.setValidRound(calld.params, calld.event);
  } else if (calld.method === "resetLockedValue") {
    actions.resetLockedValue(calld.params, calld.event);
  } else if (calld.method === "resetLockedRound") {
    actions.resetLockedRound(calld.params, calld.event);
  } else if (calld.method === "resetValidValue") {
    actions.resetValidValue(calld.params, calld.event);
  } else if (calld.method === "resetValidRound") {
    actions.resetValidRound(calld.params, calld.event);
  } else if (calld.method === "resetPrecommits") {
    actions.resetPrecommits(calld.params, calld.event);
  } else if (calld.method === "sendCommit") {
    actions.sendCommit(calld.params, calld.event);
  } else if (calld.method === "setup") {
    actions.setup(calld.params, calld.event);
  } else if (calld.method === "forwardMsgToChat") {
    actions.forwardMsgToChat(calld.params, calld.event);
  } else if (calld.method === "connectPeers") {
    actions.connectPeers(calld.params, calld.event);
  } else if (calld.method === "connectRooms") {
    actions.connectRooms(calld.params, calld.event);
  } else if (calld.method === "requestBlockSync") {
    actions.requestBlockSync(calld.params, calld.event);
  } else if (calld.method === "requestValidatorNodeInfoIfSynced") {
    actions.requestValidatorNodeInfoIfSynced(calld.params, calld.event);
  } else if (calld.method === "registerValidatorWithNetwork") {
    actions.registerValidatorWithNetwork(calld.params, calld.event);
  } else if (calld.method === "transitionNodeToValidator") {
    actions.transitionNodeToValidator(calld.params, calld.event);
  } else if (calld.method === "receivePrevote") {
    actions.receivePrevote(calld.params, calld.event);
  } else if (calld.method === "receivePrecommit") {
    actions.receivePrecommit(calld.params, calld.event);
  } else if (calld.method === "receiveBlockProposal") {
    actions.receiveBlockProposal(calld.params, calld.event);
  } else if (calld.method === "receiveCommit") {
    actions.receiveCommit(calld.params, calld.event);
  } else if (calld.method === "receiveUpdateNodeRequest") {
    actions.receiveUpdateNodeRequest(calld.params, calld.event);
  } else if (calld.method === "receiveStateSyncRequest") {
    actions.receiveStateSyncRequest(calld.params, calld.event);
  } else if (calld.method === "receiveStateSyncResponse") {
    actions.receiveStateSyncResponse(calld.params, calld.event);
  } else if (calld.method === "receiveUpdateNodeResponse") {
    actions.receiveUpdateNodeResponse(calld.params, calld.event);
  } else if (calld.method === "StartNode") {
    actions.StartNode();
  }
  else {
    revert(`invalid function call data: ${calld.method}`);
  }
  // we may have set the return data during execution
  result = wasmx.getFinishData();
  wasmx.finish(result);
}

export function p2pmsg(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const calld = getCallDataWrap();
  if (calld.method === "receivePrevote") {
    actions.receivePrevote(calld.params, calld.event);
  } else if (calld.method === "receivePrecommit") {
    actions.receivePrecommit(calld.params, calld.event);
  } else if (calld.method === "receiveBlockProposal") {
    actions.receiveBlockProposal(calld.params, calld.event);
  } else if (calld.method === "receiveCommit") {
    actions.receiveCommit(calld.params, calld.event);
  } else if (calld.method === "receiveUpdateNodeRequest") {
    actions.receiveUpdateNodeRequest(calld.params, calld.event);
  } else if (calld.method === "receiveStateSyncRequest") {
    actions.receiveStateSyncRequest(calld.params, calld.event);
  } else if (calld.method === "receiveStateSyncResponse") {
    actions.receiveStateSyncResponse(calld.params, calld.event);
  } else if (calld.method === "receiveUpdateNodeResponse") {
    actions.receiveUpdateNodeResponse(calld.params, calld.event);
  }
}
