import { JSON } from "json-as/assembly";
import { MsgCloseRequest, MsgCloseResponse, MsgConnectRequest, MsgConnectResponse, MsgExecuteRequest, MsgExecuteResponse, MsgPingRequest, MsgPingResponse, MsgQueryRequest, MsgQueryResponse } from "wasmx-env-sql/assembly/types";

export const MODULE_NAME = "test-sql"

// @ts-ignore
@serializable
export class MsgNestedCall {
    execute: MsgExecuteRequest[]
    query: MsgQueryRequest[]
    iteration_index: u32
    revert_array: boolean[]
    isquery_array: boolean[]
    constructor(
        execute: MsgExecuteRequest[],
        query: MsgQueryRequest[],
        iteration_index: u32,
        revertArray: boolean[],
        isquery_array: boolean[],
    ) {
        this.execute = execute
        this.query = query
        this.iteration_index = iteration_index
        this.revert_array = revertArray
        this.isquery_array = isquery_array
    }
}
