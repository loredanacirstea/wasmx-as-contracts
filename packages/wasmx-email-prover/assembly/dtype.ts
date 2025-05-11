import { JSON } from "json-as/assembly";
import { JSON as JSONDyn } from "assemblyscript-json/assembly";
import { CreateTableRequest, InsertRequest, MsgExecuteBatchResponse, ReadFieldRequest, ReadRequest, MsgQueryResponse } from "wasmx-dtype/assembly/types";
import { getDTypeIdentifier, rowsArrToObjArr } from "wasmx-dtype/assembly/helpers";
import { base64ToString, stringToBase64 } from "wasmx-utils/assembly/utils";
import { callContract } from "wasmx-env/assembly/utils";
import { ROLE_DTYPE } from "wasmx-env/assembly/roles";
import { MODULE_NAME } from "./types";
import { revert } from "./utils";

export function getDTypeValues(tableId: i64, tableName: string, cond: string): JSONDyn.Obj[] {
    const calld = JSON.stringify<ReadRequest>(new ReadRequest(
        getDTypeIdentifier(tableId, tableName),
        stringToBase64(cond),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Read":${calld}}`, true, MODULE_NAME)
    if (resp.success > 0) {
        revert(`getDTypeValues failed for table ${tableName}: ${cond}, ${resp.data}`)
    }
    const result = JSON.parse<MsgQueryResponse>(resp.data)
    if (result.error != "") {
        revert(`getDTypeValues failed for table ${tableName}: ${cond}: ${result.error}`)
    }
    let arr = rowsArrToObjArr(base64ToString(result.data));
    return arr;
}

export function getDTypeFieldValue(tableId: i64, tableName: string, fieldName: string, data: string): string {
    const calld = JSON.stringify<ReadFieldRequest>(new ReadFieldRequest(
        getDTypeIdentifier(tableId, tableName),
        0, fieldName,
        stringToBase64(data),
    ))
    const resp = callContract(ROLE_DTYPE, `{"ReadField":${calld}}`, true, MODULE_NAME)
    if (resp.success > 0) {
        revert(`getFieldValue failed for table ${tableName}, field ${fieldName}: ${resp.data}`)
    }
    const result = JSON.parse<MsgQueryResponse>(resp.data)
    if (result.error != "") {
        revert(`getFieldValue failed for table ${tableName}, field ${fieldName}: ${result.error}`)
    }
    return base64ToString(result.data)
}

export function insertDTypeValues(tableId: i64, tableName: string, obj: string): i64[] {
    const calld = JSON.stringify<InsertRequest>(new InsertRequest(
        getDTypeIdentifier(tableId, tableName),
        stringToBase64(obj),
    ))
    const resp = callContract(ROLE_DTYPE, `{"Insert":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`insertFieldValues failed: ${resp.data}`)
    }
    const response = JSON.parse<MsgExecuteBatchResponse>(resp.data)
    if (response.error != "") {
        revert(response.error)
    }
    if (response.responses.length == 0) revert(`no insert performed`)
    let ids: i64[] = []
    for (let i = 0; i < response.responses.length; i++) {
        ids.push(response.responses[i].last_insert_id)
    }
    return ids
}

export function createTable(tableId: i64): void {
    const calld = JSON.stringify<CreateTableRequest>(new CreateTableRequest(tableId))
    const resp = callContract(ROLE_DTYPE, `{"CreateTable":${calld}}`, false, MODULE_NAME)
    if (resp.success > 0) {
        revert(`createTable failed for id '${tableId}': ${resp.data}`)
    }
    const response = JSON.parse<MsgExecuteBatchResponse>(resp.data)
    if (response.error != "") {
        revert(response.error)
    }
}
