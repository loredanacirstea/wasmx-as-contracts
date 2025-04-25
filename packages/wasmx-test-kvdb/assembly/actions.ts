import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as kvdbw from "wasmx-env-kvdb/assembly/kvdb_wrap";
import { KvDeleteRequest, KvDeleteResponse, KvGetRequest, KvGetResponse, KvHasRequest, KvHasResponse, KvIteratorRequest, KvIteratorResponse, KvSetRequest, KvSetResponse, MsgCloseRequest, MsgCloseResponse, MsgConnectRequest, MsgConnectResponse } from "wasmx-env-kvdb/assembly/types";
import { MODULE_NAME, MsgNestedCall } from "./types";
import { CallRequest } from "wasmx-env/assembly/types";
import { BigInt } from "wasmx-env/assembly/bn";

export function Connect(req: MsgConnectRequest): ArrayBuffer {
    const resp = kvdbw.Connect(req)
    return String.UTF8.encode(JSON.stringify<MsgConnectResponse>(resp))
}

export function Close(req: MsgCloseRequest): ArrayBuffer {
    const resp = kvdbw.Close(req)
    return String.UTF8.encode(JSON.stringify<MsgCloseResponse>(resp))
}

export function Get(req: KvGetRequest): ArrayBuffer {
    const resp = kvdbw.Get(req)
    return String.UTF8.encode(JSON.stringify<KvGetResponse>(resp))
}

export function Has(req: KvHasRequest): ArrayBuffer {
    const resp = kvdbw.Has(req)
    return String.UTF8.encode(JSON.stringify<KvHasResponse>(resp))
}

export function Set(req: KvSetRequest): ArrayBuffer {
    const resp = kvdbw.Set(req)
    return String.UTF8.encode(JSON.stringify<KvSetResponse>(resp))
}

export function Delete(req: KvDeleteRequest): ArrayBuffer {
    const resp = kvdbw.Delete(req)
    return String.UTF8.encode(JSON.stringify<KvDeleteResponse>(resp))
}

export function Iterator(req: KvIteratorRequest): ArrayBuffer {
    const resp = kvdbw.Iterator(req)
    return String.UTF8.encode(JSON.stringify<KvIteratorResponse>(resp))
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
    Set(exec)

    const qresp = Get(query)
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
