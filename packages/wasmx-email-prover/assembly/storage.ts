import { JSON } from "json-as";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { MsgInitializeRequest, RelationTypeIds, TableIds } from "./types";

export function setTableIds(ids: TableIds): void {
    wasmxw.sstore("tableids", JSON.stringify<TableIds>(ids))
}

export function getTableIds(): TableIds {
    return JSON.parse<TableIds>(wasmxw.sload("tableids"))
}

export function setRelationTypes(ids: RelationTypeIds): void {
    wasmxw.sstore("relationtypeids", JSON.stringify<RelationTypeIds>(ids))
}

export function getRelationTypes(): RelationTypeIds {
    return JSON.parse<RelationTypeIds>(wasmxw.sload("relationtypeids"))
}

export function setInitializeData(data: MsgInitializeRequest): void {
    wasmxw.sstore("initdata", JSON.stringify<MsgInitializeRequest>(data))
}

export function getInitializeData(): MsgInitializeRequest {
    return JSON.parse<MsgInitializeRequest>(wasmxw.sload("initdata"))
}
