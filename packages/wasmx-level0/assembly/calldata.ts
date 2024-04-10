import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { EmptyRequest, MsgInitialize } from './types';

// @ts-ignore
@serializable
export class CallData {
    method: EmptyRequest | null = null;
}

export function getCallDataInitialize(): MsgInitialize {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<MsgInitialize>(calldstr);
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
