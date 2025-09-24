import { JSON } from "json-as";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as sqlw from "wasmx-env-sql/assembly/postgresql_wrap";
import { MsgCloseRequest, MsgCloseResponse, MsgConnectRequestPostgresql, MsgConnectResponse, MsgExecuteBatchRequest, MsgExecuteBatchResponsePostgreSql, MsgExecuteRequest, MsgExecuteResponsePostgreSql, MsgPingRequest, MsgPingResponse, MsgQueryRequest, MsgQueryResponse, MsgCreateDatabaseRequest, MsgCreateDatabaseResponse } from "wasmx-env-sql/assembly/types";
import { MODULE_NAME, MsgNestedCall } from "./types";
import { CallRequest } from "wasmx-env/assembly/types";
import { BigInt } from "wasmx-env/assembly/bn";

export function Connect(req: MsgConnectRequestPostgresql): ArrayBuffer {
    const resp = sqlw.Connect(req)
    return String.UTF8.encode(JSON.stringify<MsgConnectResponse>(resp))
}

export function CreateDatabase(req: MsgCreateDatabaseRequest): ArrayBuffer {
    const resp = sqlw.CreateDatabase(req)
    return String.UTF8.encode(JSON.stringify<MsgCreateDatabaseResponse>(resp))
}

export function Close(req: MsgCloseRequest): ArrayBuffer {
    const resp = sqlw.Close(req)
    return String.UTF8.encode(JSON.stringify<MsgCloseResponse>(resp))
}

export function Execute(req: MsgExecuteRequest): ArrayBuffer {
    const resp = sqlw.Execute(req)
    return String.UTF8.encode(JSON.stringify<MsgExecuteResponsePostgreSql>(resp))
}

export function BatchAtomic(req: MsgExecuteBatchRequest): ArrayBuffer {
    const resp = sqlw.BatchAtomic(req)
    return String.UTF8.encode(JSON.stringify<MsgExecuteBatchResponsePostgreSql>(resp))
}

export function Query(req: MsgQueryRequest): ArrayBuffer {
    const resp = sqlw.Query(req)
    return String.UTF8.encode(JSON.stringify<MsgQueryResponse>(resp))
}

export function Ping(req: MsgPingRequest): ArrayBuffer {
    const resp = sqlw.Ping(req)
    return String.UTF8.encode(JSON.stringify<MsgPingResponse>(resp))
}

export function NestedCall(req: MsgNestedCall): ArrayBuffer {
    console.log(`* NestedCall: ${req.iteration_index} - revert_len=${req.revert_array.length} ; exec_len=${req.execute.length} ; query_len=${req.query.length}`)
    if (req.revert_array.length != req.iteration_index + 1) {
        wasmxw.revert("revertArray length mismatch")
    }
    if (req.execute.length != req.iteration_index + 1) {
        wasmxw.revert("execute cmds length mismatch")
    }
    if (req.query.length != req.iteration_index + 1) {
        wasmxw.revert("query cmds length mismatch")
    }
    if (req.isquery_array.length != req.iteration_index) {
        wasmxw.revert("is query array length mismatch")
    }
    const exec = req.execute.shift()
    const query = req.query.shift()
    Execute(exec)

    const qresp = Query(query)
    const response: string[] = [String.UTF8.decode(qresp)]
    const willrevert = req.revert_array.shift()
    console.log(`* NestedCall: ${req.iteration_index} - willrevert=${willrevert} ; query=${response[0]}`)
    if (req.iteration_index > 0) {
        const isquery = req.isquery_array.shift()
        const newreq = new MsgNestedCall(req.execute, req.query, req.iteration_index - 1, req.revert_array, req.isquery_array)
        const calldata = `{"NestedCall":${JSON.stringify<MsgNestedCall>(newreq)}}`
        const callreq = new CallRequest(wasmxw.getAddress(), calldata, BigInt.zero(), 10000000, isquery)
        const resp = wasmxw.call(callreq, MODULE_NAME)
        resp.data = String.UTF8.decode(base64.decode(resp.data).buffer)
        response.push(resp.data);
        console.log(`* NestedCall: ${req.iteration_index} - nested_call_response=${resp.data}`)
    }
    if (willrevert) {
        wasmxw.revert("nested call must revert")
    }
    return String.UTF8.encode(JSON.stringify<string[]>(response))
}
