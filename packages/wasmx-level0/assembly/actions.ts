import { JSON } from "json-as/assembly";
import * as sha256 from "@ark-us/as-sha256/assembly/index";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { Block, MsgNewTransaction, MsgNewTransactionResponse } from "./types";
import { LoggerError } from "./utils";
import { buildNewBlock } from "./block";
import { chainId, setBlock } from "./storage";

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

export function ifEnoughMembers(
    params: ActionParam[],
    event: EventObject,
): bool {
    // TODO
    return true
}

export function newTransaction(req: MsgNewTransaction): ArrayBuffer {
    const block = buildNewBlock([req.transaction], chainId);
    const data = JSON.stringify<Block>(block)
    setBlock(data, block.hash, block.data_hashes);

    return String.UTF8.encode(JSON.stringify<MsgNewTransactionResponse>(new MsgNewTransactionResponse(block.data_hashes[0], block.hash)))
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

export function newBlock(
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
