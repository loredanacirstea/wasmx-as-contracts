import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgInitialize, MsgStart, QueryBlockRequest, QueryLastBlockRequest } from "./types";

@json
export class CallData {
    StartNode: MsgStart | null = null;
    start: MsgStart | null = null;
    getLastBlock: QueryLastBlockRequest | null = null;
    getBlock: QueryBlockRequest | null = null;
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
