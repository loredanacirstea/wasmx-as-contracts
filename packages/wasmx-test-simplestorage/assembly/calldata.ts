import { JSON } from "json-as/assembly";
import { MsgCrossChainCallRequest } from "wasmx-env/assembly/types";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgGet, MsgSet } from "./types";

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    set: MsgSet | null = null;
    get: MsgGet | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataCrossChain(): MsgCrossChainCallRequest {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<MsgCrossChainCallRequest>(calldstr);
}
