import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgStart, QueryBlockRequest, QueryLastBlockRequest } from "./types";

// @ts-ignore
@serializable
export class CallData {
    StartNode: MsgStart | null = null;
    getLastBlock: QueryLastBlockRequest | null = null;
    getBlock: QueryBlockRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
