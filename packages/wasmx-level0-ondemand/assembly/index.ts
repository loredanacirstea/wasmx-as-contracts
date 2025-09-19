import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import * as level0 from "wasmx-level0/assembly/actions";
import * as tnd from "wasmx-tendermint/assembly/actions";
import * as tnd2 from "wasmx-tendermint-p2p/assembly/actions";
import * as tnd2mc from "wasmx-tendermint-p2p/assembly/multichain";
import { wrapGuard } from "wasmx-level0/assembly/actions";
import { revert } from "./utils";
import * as actions from "./actions";
import { onlyInternal } from "wasmx-env/assembly/utils";
import { MODULE_NAME } from "./types";

export function wasmx_env_2(): void {}

export function wasmx_p2p_1(): void {}

export function wasmx_multichain_1(): void {}

export function wasmx_crosschain_1(): void {}

export function wasmx_consensus_json_1(): void {}

export function wasmx_nondeterministic_1(): void {}

export function instantiate(): void {
  // const calld = getCallDataInitialize()
}

export function main(): void {
  onlyInternal(MODULE_NAME, "");

  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.method === "sendNewTransactionResponse") {
    tnd.sendNewTransactionResponse(calld.params, calld.event);
  } else if (calld.method === "addToMempool") {
    tnd2.addToMempool(calld.params, calld.event);
  } else if (calld.method === "isNextProposer") {
    result = wrapGuard(level0.isNextProposer(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifNextBlockProposal") {
    result = wrapGuard(level0.ifNextBlockProposal(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifPrecommitAnyThreshold") {
    result = wrapGuard(level0.ifPrecommitAnyThreshold(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifPrecommitAcceptThreshold") {
    result = wrapGuard(level0.ifPrecommitAcceptThreshold(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifSenderIsProposer") {
    result = wrapGuard(tnd2.ifSenderIsProposer(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifForceProposalReset") {
    result = wrapGuard(tnd2.ifForceProposalReset(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifNodeIsValidator") {
    result = wrapGuard(tnd2.ifNodeIsValidator(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "newValidatorIsSelf") {
    result = wrapGuard(tnd2.newValidatorIsSelf(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifNewTransaction") {
    result = wrapGuard(tnd.ifNewTransaction(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifMempoolEmpty") {
    result = wrapGuard(actions.ifMempoolEmpty(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifMempoolNotEmpty") {
    result = wrapGuard(actions.ifMempoolNotEmpty(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifOldTransaction") {
    result = wrapGuard(actions.ifOldTransaction(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "ifMempoolFull") {
    result = wrapGuard(actions.ifMempoolFull(calld.params, calld.event));
    wasmx.finish(result);
    return;
  } else if (calld.method === "setRoundProposer") {
    level0.setRoundProposer(calld.params, calld.event);
  } else if (calld.method === "sendBlockProposal") {
    tnd2.sendBlockProposal(calld.params, calld.event);
  } else if (calld.method === "sendPrevote") {
    tnd2.sendPrevote(calld.params, calld.event);
  } else if (calld.method === "sendPrecommit") {
    tnd2.sendPrecommit(calld.params, calld.event);
  } else if (calld.method === "sendPrecommitNil") {
    tnd2.sendPrecommitNil(calld.params, calld.event);
  } else if (calld.method === "setupNode") {
    level0.setupNode(calld.params, calld.event);
  } else if (calld.method === "addToMempool") {
    tnd.addToMempool(calld.params, calld.event);
  } else if (calld.method === "commitBlock") {
    tnd2.commitBlock(calld.params, calld.event);
  } else if (calld.method === "sendNewTransactionResponse") {
    tnd.sendNewTransactionResponse(calld.params, calld.event);
  } else if (calld.method === "incrementCurrentTerm") {
    tnd.incrementCurrentTerm(calld.params, calld.event);
  } else if (calld.method === "updateNodeAndReturn") {
    tnd2.updateNodeAndReturn(calld.params, calld.event);
  } else if (calld.method === "proposeBlock") {
    tnd2.proposeBlock(calld.params, calld.event);
  } else if (calld.method === "resetPrecommits") {
    tnd2.resetPrecommits(calld.params, calld.event);
  } else if (calld.method === "sendCommit") {
    tnd2.sendCommit(calld.params, calld.event);
  } else if (calld.method === "setup") {
    level0.setup(calld.params, calld.event);
  } else if (calld.method === "forwardMsgToChat") {
    tnd2.forwardMsgToChat(calld.params, calld.event);
  } else if (calld.method === "connectPeers") {
    tnd2.connectPeers(calld.params, calld.event);
  } else if (calld.method === "connectRooms") {
    tnd2.connectRooms(calld.params, calld.event);
  } else if (calld.method === "requestBlockSync") {
    tnd2.requestBlockSync(calld.params, calld.event);
  } else if (calld.method === "requestValidatorNodeInfoIfSynced") {
    tnd2.requestValidatorNodeInfoIfSynced(calld.params, calld.event);
  } else if (calld.method === "registerValidatorWithNetwork") {
    tnd2.registerValidatorWithNetwork(calld.params, calld.event);
  } else if (calld.method === "transitionNodeToValidator") {
    tnd2.transitionNodeToValidator(calld.params, calld.event);
  } else if (calld.method === "receivePrecommit") {
    tnd2.receivePrecommit(calld.params, calld.event);
  } else if (calld.method === "receiveBlockProposal") {
    tnd2.receiveBlockProposal(calld.params, calld.event);
  } else if (calld.method === "receiveCommit") {
    tnd2.receiveCommit(calld.params, calld.event);
  } else if (calld.method === "receiveUpdateNodeRequest") {
    tnd2.receiveUpdateNodeRequest(calld.params, calld.event);
  } else if (calld.method === "receiveStateSyncRequest") {
    tnd2.receiveStateSyncRequest(calld.params, calld.event);
  } else if (calld.method === "receiveStateSyncResponse") {
    tnd2.receiveStateSyncResponse(calld.params, calld.event);
  } else if (calld.method === "receiveUpdateNodeResponse") {
    tnd2.receiveUpdateNodeResponse(calld.params, calld.event);
  } else if (calld.method === "buildGenTx") {
    tnd2mc.buildGenTx(calld.params, calld.event);
    wasmx.finish(wasmx.getFinishData());
    return;
  } else if (calld.method === "getLastBlockCommit") {
    tnd2.getLastBlockCommitExternal();
    wasmx.finish(wasmx.getFinishData());
    return;
  } else if (calld.method === "bootstrapAfterStateSync") {
    tnd2.bootstrapAfterStateSync(calld.params, calld.event);
    wasmx.finish(wasmx.getFinishData());
    return;
  } else if (calld.method === "commitAfterStateSync") {
    tnd2.commitAfterStateSync(calld.params, calld.event);
    wasmx.finish(wasmx.getFinishData());
    return;
  } else if (calld.method === "getNodeInfo") {
    tnd2.getNodeInfo(calld.params, calld.event);
    wasmx.finish(wasmx.getFinishData());
    return;
  } else if (calld.method === "signMessage") {
    tnd2.signMessageExternal(calld.params, calld.event);
    wasmx.finish(wasmx.getFinishData());
    return;
  } else if (calld.method === "VerifyCommitLight") {
    level0.VerifyCommitLight(calld.params, calld.event);
    wasmx.finish(wasmx.getFinishData());
    return;
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
