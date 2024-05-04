import { JSON } from "json-as/assembly";
import * as sha256 from "@ark-us/as-sha256/assembly/index";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { base64ToHex } from "wasmx-utils/assembly/utils";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import { Block, CurrentState, MsgNewTransaction, MsgNewTransactionResponse } from "./types";
import { LoggerDebug, LoggerError, LoggerInfo, revert } from "./utils";
import { buildNewBlock, commitBlock, proposeBlock } from "./block";
import { setBlock, setCurrentState } from "./storage";
import { LOG_START } from "./config";
import { callStorage } from "wasmx-tendermint-p2p/assembly/action_utils";

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

export function setupNode(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("initChainSetup")) {
        revert("no initChainSetup found");
    }
    const initChainSetup = ctx.get("initChainSetup") // base64
    const datajson = String.UTF8.decode(base64.decode(initChainSetup).buffer);

    LoggerDebug("setupNode", ["initChainSetup", datajson])
    const data = JSON.parse<typestnd.InitChainSetup>(datajson);
    initChain(data);
}

export function setup(
    params: ActionParam[],
    event: EventObject,
): void {
    LoggerInfo("setting up new level0 consensus contract", ["error", "not implemented"])
}

export function ifEnoughMembers(
    params: ActionParam[],
    event: EventObject,
): boolean {
    // TODO
    return true
}

export function newBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    // const block = buildNewBlock();
    // setBlock(block);
    // finalizeBlock(block);
    proposeBlock();
    commitBlock();
}

export function setRepresentative(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function sendSubBlock(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function receiveSubBlock(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function broadcastNewBlock(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function sendJoinInvite(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function receiveJoinInvite(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function sendJoinResponse(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function deployNextLevel(
    params: ActionParam[],
    event: EventObject,
): void {

}

function finalizeBlock(block: Block): void {
    const lastCommit = new typestnd.CommitInfo(0, []);
    const processReq = new typestnd.RequestProcessProposal(
        [],
        lastCommit,
        [],
        block.hash,
        block.header.index,
        block.header.time.toISOString(),
        "",
        "",
    )
    const processResp = consensuswrap.ProcessProposal(processReq);
    if (processResp.status === typestnd.ProposalStatus.REJECT) {
        // TODO - what to do here? returning just discards the block and the transactions
        LoggerError("new block rejected", ["height", processReq.height.toString()])
    }
    const finalizeReq = new typestnd.RequestFinalizeBlock(
        [],
        lastCommit,
        [],
        block.hash,
        block.header.index,
        block.header.time.toISOString(),
        "",
        "",
    )
    const resbegin = consensuswrap.BeginBlock(finalizeReq);
    if (resbegin.error.length > 0) {
        revert(`${resbegin.error}`);
    }
    let respWrap = consensuswrap.FinalizeBlock(finalizeReq);
    if (respWrap.error.length > 0) {
        revert(`consensus break: ${respWrap.error}`);
    }
    const blockData = JSON.stringify<Block>(block)
    const resend = consensuswrap.EndBlock(blockData);
    if (resend.error.length > 0) {
        revert(`${resend.error}`);
    }
    const commitResponse = consensuswrap.Commit();
    LoggerInfo("block finalized", ["height", block.header.index.toString()])
}

export function initChain(req: typestnd.InitChainSetup): void {
    LoggerDebug("start chain init", [])

    // TODO what are the correct empty valuew?
    // we need a non-empty string value, because we use this to compute next proposer
    const emptyBlockId = new typestnd.BlockID(base64ToHex(req.app_hash), new typestnd.PartSetHeader(0, ""))
    const last_commit_hash = ""
    const currentState = new CurrentState(
        req.chain_id,
        // req.version,
        req.app_hash,
        emptyBlockId,
        last_commit_hash,
        req.last_results_hash,
        // 0, [],
        req.validator_address,
        req.validator_privkey,
        req.validator_pubkey,
        LOG_START + 1, "",
        // 0, 0, 0, 0,
        // [], 0, 0,
    );

    const valuestr = JSON.stringify<CurrentState>(currentState);
    LoggerDebug("set current state", ["state", valuestr])
    setCurrentState(currentState);
    setConsensusParams(req.consensus_params);
    LoggerDebug("current state set", [])
}

export function setConsensusParams(value: typestnd.ConsensusParams): void {
    const valuestr = JSON.stringify<typestnd.ConsensusParams>(value)
    const calldata = `{"setConsensusParams":{"params":"${base64.encode(Uint8Array.wrap(String.UTF8.encode(valuestr)))}"}}`
    const resp = callStorage(calldata, false);
    if (resp.success > 0) {
        revert("could not set consensus params");
    }
}
