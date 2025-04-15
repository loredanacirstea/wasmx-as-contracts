import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgConnectRequest, MsgExecuteRequest, MsgPingRequest, MsgQueryRequest } from "wasmx-env-sql/assembly/types";

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    Connect: MsgConnectRequest | null = null;
    Execute: MsgExecuteRequest | null = null;
    Query: MsgQueryRequest | null = null;
    Ping: MsgPingRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
