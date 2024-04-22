import { JSON } from "json-as/assembly";
import * as sha256 from "@ark-us/as-sha256/assembly/index";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import { Block, MsgNewTransaction, MsgNewTransactionResponse } from "./types";
import { LoggerError, LoggerInfo, revert } from "./utils";
import { buildNewBlock } from "./block";
import { chainId, setBlock } from "./storage";

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

export function setupNode(
    params: ActionParam[],
    event: EventObject,
): void {
    // TODO
}

export function ifEnoughMembers(
    params: ActionParam[],
    event: EventObject,
): boolean {
    // TODO
    return true
}

// req: MsgNewTransaction
export function newTransaction(
    params: ActionParam[],
    event: EventObject,
): void {
    console.info("--newTransaction--")
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("transaction")) {
        revert("no transaction found");
    }
    const transaction = ctx.get("transaction") // base64
    console.info("--newTransaction--" + transaction);

    // const block = buildNewBlock([req.transaction], chainId);
    // const data = JSON.stringify<Block>(block)
    // setBlock(data, block.hash, block.data_hashes);
    // return String.UTF8.encode(JSON.stringify<MsgNewTransactionResponse>(new MsgNewTransactionResponse(block.data_hashes[0], block.hash)))
}

export function newBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    const block = buildNewBlock([], chainId);
    setBlock(block);
    finalizeBlock(block);
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
