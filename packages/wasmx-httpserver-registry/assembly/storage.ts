import { JSON } from "json-as";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { TableIds } from "./types";

export function setTableIds(ids: TableIds): void {
    wasmxw.sstore("tableids", JSON.stringify<TableIds>(ids))
}

export function getTableIds(): TableIds {
    return JSON.parse<TableIds>(wasmxw.sload("tableids"))
}
