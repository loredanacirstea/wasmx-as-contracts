import { JSON } from "json-as";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { Config, MsgInitializeRequest, RelationTypeIds, TableIds } from "./types";

export function setConfig(data: Config): void {
    wasmxw.sstore("config", JSON.stringify<Config>(data))
}

export function getConfig(): Config {
    return JSON.parse<Config>(wasmxw.sload("config"))
}

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
