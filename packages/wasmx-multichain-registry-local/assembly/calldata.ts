import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgAddSubChainId, MsgInitialize, QuerySubChainIds } from "./types";

// @ts-ignore
@serializable
export class CallData {
    AddSubChainId: MsgAddSubChainId | null = null;

    // query
    GetSubChainIds: QuerySubChainIds | null = null;
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
