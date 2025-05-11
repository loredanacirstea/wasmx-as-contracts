import { JSON } from "json-as";
import { KvGetRequest, KvSetRequest, MsgCloseRequest, MsgCloseResponse, MsgConnectRequest, MsgConnectResponse } from "wasmx-env-kvdb/assembly/types";

export const MODULE_NAME = "test-kvdb"

@json
export class MsgNestedCall {
    execute: KvSetRequest[]
    query: KvGetRequest[]
    iteration_index: u32
    revert_array: boolean[]
    isquery_array: boolean[]
    constructor(
        execute: KvSetRequest[],
        query: KvGetRequest[],
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
