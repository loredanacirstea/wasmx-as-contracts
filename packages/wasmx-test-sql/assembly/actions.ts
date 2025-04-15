import { JSON } from "json-as/assembly";
import * as sqlw from "wasmx-env-sql/assembly/sql_wrap";
import { MsgConnectRequest, MsgConnectResponse, MsgExecuteRequest, MsgExecuteResponse, MsgPingRequest, MsgPingResponse, MsgQueryRequest, MsgQueryResponse } from "wasmx-env-sql/assembly/types";

export function Connect(req: MsgConnectRequest): ArrayBuffer {
    const resp = sqlw.Connect(req)
    return String.UTF8.encode(JSON.stringify<MsgConnectResponse>(resp))
}

export function Execute(req: MsgExecuteRequest): ArrayBuffer {
    const resp = sqlw.Execute(req)
    return String.UTF8.encode(JSON.stringify<MsgExecuteResponse>(resp))
}

export function Query(req: MsgQueryRequest): ArrayBuffer {
    const resp = sqlw.Query(req)
    return String.UTF8.encode(JSON.stringify<MsgQueryResponse>(resp))
}

export function Ping(req: MsgPingRequest): ArrayBuffer {
    const resp = sqlw.Ping(req)
    return String.UTF8.encode(JSON.stringify<MsgPingResponse>(resp))
}
