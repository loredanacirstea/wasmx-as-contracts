import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgStoreConversation, QueryVerifyConversation } from './types';
import { Base64String } from "wasmx-env/assembly/types";

// @ts-ignore
@serializable
export class StartNodeCalld {
    data: Base64String = ""
}

// @ts-ignore
@serializable
export class CallData {
    StoreConversation: MsgStoreConversation | null = null;

    // queries
    VerifyConversation: QueryVerifyConversation | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
