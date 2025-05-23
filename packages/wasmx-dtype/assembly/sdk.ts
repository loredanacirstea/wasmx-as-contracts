import { JSON } from "json-as";
import { JSON as JSONDyn } from "assemblyscript-json/assembly";
import { SDK } from "wasmx-env/assembly/sdk";
import { CreateTableRequest, InsertRequest, MsgExecuteBatchResponse, ReadFieldRequest, ReadRequest, MsgQueryResponse, GetRecordsByRelationTypeRequest, UpdateRequest, ReadRawRequest, DeleteRequest } from "wasmx-dtype/assembly/types";
import { getDTypeIdentifier, rowsArrToObjArr } from "wasmx-dtype/assembly/helpers";
import { base64ToString, stringToBase64 } from "wasmx-utils/assembly/utils";
import { callContract } from "wasmx-env/assembly/utils";
import { ROLE_DTYPE } from "wasmx-env/assembly/roles";
import { CallResponse } from "wasmx-env/assembly/types";

@json
export class ResponseStringWithError {
    constructor(
        public error: string,
        public data: string,
    ) {}
}

export class DTypeSdk extends SDK {
    constructor(
        caller_module_name: string,
        revert: (message: string) => void,
        LoggerInfo: (msg: string, parts: string[]) => void,
        LoggerError: (msg: string, parts: string[]) => void,
        LoggerDebug: (msg: string, parts: string[]) => void,
        LoggerDebugExtended: (msg: string, parts: string[]) => void,
    ) {
        super(caller_module_name, revert, LoggerInfo, LoggerError, LoggerDebug, LoggerDebugExtended);
        this.roleOrAddress = ROLE_DTYPE;
    }
    ReadRaw(tableId: i64, tableName: string, query: string, params_: string[]): string {
        const params = new Array<string>(params_.length)
        for (let i = 0; i < params_.length; i++) {
            params[i] = stringToBase64(params_[i])
        }
        const calld = JSON.stringify<ReadRawRequest>(new ReadRawRequest(
            getDTypeIdentifier(tableId, tableName),
            query,
            params,
        ))
        const data = this.querySafe(`{"ReadRaw":${calld}}`)
        const result = JSON.parse<MsgQueryResponse>(data)
        if (result.error != "") {
            this.revert(`failed to decode ${data} to MsgQueryResponse: ${result.error}`)
        }
        return base64ToString(result.data);
    }

    GetRecordsByRelationType(relationTypeId: i64, relationType: string, tableId: i64, recordId: i64, nodeType: string): JSONDyn.Obj[] {
        const calld = JSON.stringify<GetRecordsByRelationTypeRequest>(new GetRecordsByRelationTypeRequest(relationTypeId, relationType, tableId, recordId, nodeType))

        const data = this.querySafe(`{"GetRecordsByRelationType":${calld}}`)
        const result = JSON.parse<MsgQueryResponse>(data)
        if (result.error != "") {
            this.revert(`failed to decode ${data} to MsgQueryResponse: ${result.error}`)
        }
        let arr = rowsArrToObjArr(base64ToString(result.data));
        return arr;
    }

    Read(tableId: i64, tableName: string, cond: string): string {
        const calld = JSON.stringify<ReadRequest>(new ReadRequest(
            getDTypeIdentifier(tableId, tableName),
            stringToBase64(cond),
        ))
        const data = this.querySafe(`{"Read":${calld}}`)
        const result = JSON.parse<MsgQueryResponse>(data)
        if (result.error != "") {
            this.revert(`failed to decode ${data} to MsgQueryResponse: ${result.error}`)
        }
        return base64ToString(result.data);
    }

    ReadDyn(tableId: i64, tableName: string, cond: string): JSONDyn.Obj[] {
        const data = this.Read(tableId, tableName, cond)
        return rowsArrToObjArr(data);
    }

    ReadField(tableId: i64, tableName: string, fieldName: string, data: string): string {
        const resp = this.ReadFieldNoCheck(tableId, tableName, fieldName, data);
        if (resp.error != "") {
            this.revert(resp.error)
        }
        return resp.data;
    }

    ReadFieldNoCheck(tableId: i64, tableName: string, fieldName: string, data: string): ResponseStringWithError {
        const calld = JSON.stringify<ReadFieldRequest>(new ReadFieldRequest(
            getDTypeIdentifier(tableId, tableName),
            0, fieldName,
            stringToBase64(data),
        ))
        const rdata = this.querySafe(`{"ReadField":${calld}}`)
        const result = JSON.parse<MsgQueryResponse>(rdata)
        if (result.error != "") {
            return new ResponseStringWithError(`failed to decode ${data} to MsgQueryResponse: ${result.error}`, "")
        }
        return new ResponseStringWithError("", base64ToString(result.data))
    }

    Update(tableId: i64, tableName: string, obj: string, cond: string): void {
        this.LoggerDebugExtended("dtype.Update", ["tableId", tableId.toString(), "tableName", tableName, "cond", cond, "data", obj])
        const calld = JSON.stringify<UpdateRequest>(new UpdateRequest(
            getDTypeIdentifier(tableId, tableName),
            stringToBase64(cond),
            stringToBase64(obj),
        ))
        const data = this.executeSafe(`{"Update":${calld}}`)
        const response = JSON.parse<MsgExecuteBatchResponse>(data)
        if (response.error != "") {
            this.revert(response.error)
        }
    }

    Delete(tableId: i64, tableName: string, cond: string): void {
        this.LoggerDebugExtended("dtype.Delete", ["tableId", tableId.toString(), "tableName", tableName, "cond", cond])
        const calld = JSON.stringify<DeleteRequest>(new DeleteRequest(
            getDTypeIdentifier(tableId, tableName),
            stringToBase64(cond),
        ))
        const data = this.executeSafe(`{"Delete":${calld}}`)
        const response = JSON.parse<MsgExecuteBatchResponse>(data)
        if (response.error != "") {
            this.revert(response.error)
        }
    }

    Insert(tableId: i64, tableName: string, obj: string): i64[] {
        this.LoggerDebugExtended("dtype.Insert", ["tableId", tableId.toString(), "tableName", tableName, "data", obj])
        const calld = JSON.stringify<InsertRequest>(new InsertRequest(
            getDTypeIdentifier(tableId, tableName),
            stringToBase64(obj),
        ))
        const data = this.executeSafe(`{"Insert":${calld}}`)
        const response = JSON.parse<MsgExecuteBatchResponse>(data)
        if (response.error != "") {
            this.revert(response.error)
        }
        if (response.responses.length == 0) this.revert(`no insert performed`)
        let ids: i64[] = []
        for (let i = 0; i < response.responses.length; i++) {
            ids.push(response.responses[i].last_insert_id)
        }
        return ids
    }

    CreateTable(tableId: i64): void {
        this.LoggerDebug("dtype.CreateTable", ["tableId", tableId.toString()])
        const calld = JSON.stringify<CreateTableRequest>(new CreateTableRequest(tableId))
        const data = this.executeSafe(`{"CreateTable":${calld}}`)
        const response = JSON.parse<MsgExecuteBatchResponse>(data)
        if (response.error != "") {
            this.revert(response.error)
        }
    }
}
