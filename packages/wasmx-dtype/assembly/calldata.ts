import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { BuildSchemaRequest, CallDataInstantiate, CallDataInitializeTokens, CloseRequest, ConnectRequest, CountRequest, CreateTableRequest, DeleteRequest, InsertRequest, ReadFieldsRequest, ReadRequest, UpdateRequest, CreateIndexesRequest, DeleteIndexesRequest, GetRecordsByRelationTypeRequest, ReadRawRequest } from "./types";
import { AddRequest, MoveRequest, SubRequest } from "./types_tokens";

@json
export class MsgEmpty {}

@json
export class CallData {
    Initialize: CallDataInstantiate | null = null;
    InitializeTokens: CallDataInitializeTokens | null = null;
    InitializeIdentity: MsgEmpty | null = null;
    CreateTable: CreateTableRequest | null = null;
    CreateIndex: CreateIndexesRequest | null = null;
    DeleteIndex: DeleteIndexesRequest | null = null;
    Connect: ConnectRequest | null = null;
    Close: CloseRequest | null = null;
    Insert: InsertRequest | null = null;
    InsertOrReplace: InsertRequest | null = null;
    Update: UpdateRequest | null = null;
    Delete: DeleteRequest | null = null;
    Read: ReadRequest | null = null;
    ReadFields: ReadFieldsRequest | null = null;
    ReadRaw: ReadRawRequest | null = null;
    GetRecordsByRelationType: GetRecordsByRelationTypeRequest | null = null;
    GetFullRecordsByRelationType: GetRecordsByRelationTypeRequest | null = null;
    Count: CountRequest | null = null;
    BuildSchema: BuildSchemaRequest | null = null;
    Add: AddRequest | null = null;
    Sub: SubRequest | null = null;
    Move: MoveRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataInstantiateWrap(): CallDataInstantiate {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallDataInstantiate>(calldstr);
}
