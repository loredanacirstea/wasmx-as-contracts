import { JSON } from "json-as";
import { MsgCrossChainCallRequest } from "wasmx-env/assembly/types";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgInitialize } from "./types";

@json
export class MsgEmpty {}

@json
export class CallData {
    CrossChain: MsgCrossChainCallRequest | null = null;
    CrossChainQuery: MsgCrossChainCallRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataInitialize(): MsgInitialize {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<MsgInitialize>(calldstr);
}
