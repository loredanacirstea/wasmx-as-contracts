import { JSON } from "json-as/assembly";
import { MsgCrossChainCallRequest } from "wasmx-env/assembly/types";
import * as wasmx from 'wasmx-env/assembly/wasmx';

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    CrossChain: MsgCrossChainCallRequest | null = null;
    CrossChainQuery: MsgCrossChainCallRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
