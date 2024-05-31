import { JSON } from "json-as/assembly";
import { MsgExecuteCrossChainTxRequest } from "wasmx-env/assembly/types";
import * as wasmx from 'wasmx-env/assembly/wasmx';

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    CrossChain: MsgExecuteCrossChainTxRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
