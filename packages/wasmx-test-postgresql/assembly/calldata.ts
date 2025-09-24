import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCloseRequest, MsgConnectRequestPostgresql, MsgExecuteBatchRequest, MsgExecuteRequest, MsgPingRequest, MsgQueryRequest, MsgCreateDatabaseRequest } from "wasmx-env-sql/assembly/types";
import { MsgNestedCall } from "./types";

@json
export class MsgEmpty {}

@json
export class CallData {
    Connect: MsgConnectRequestPostgresql | null = null;
    Close: MsgCloseRequest | null = null;
    Execute: MsgExecuteRequest | null = null;
    BatchAtomic: MsgExecuteBatchRequest | null = null;
    Query: MsgQueryRequest | null = null;
    Ping: MsgPingRequest | null = null;
    NestedCall: MsgNestedCall | null = null;
    CreateDatabase: MsgCreateDatabaseRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
