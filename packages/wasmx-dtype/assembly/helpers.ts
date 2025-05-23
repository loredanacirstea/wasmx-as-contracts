import { JSON as JSONDyn } from "assemblyscript-json/assembly";
import * as config from "./config";
import { TableIndentifier } from "./types";
import { revert } from "./utils";

export function getDTypeIdentifier(table_id: i64, table_name: string): TableIndentifier {
    return new TableIndentifier(config.tableDbConnId, config.dtypeDbRecordId, table_id, config.DTypeConnection, config.DTypeDbName, table_name)
}

export function rowsArrToObjArr(rowstr: string): JSONDyn.Obj[] {
    let arr: JSONDyn.Arr = <JSONDyn.Arr>(JSONDyn.parse(rowstr));
    const result: JSONDyn.Obj[] = []
    for (let i = 0; i < arr._arr.length; i++) {
        const v = arr._arr.at(i)
        if (!v.isObj) revert("unexpected value")
        const value: JSONDyn.Obj = changetype<JSONDyn.Obj>(v);
        result.push(value)
    }
    return result
}
