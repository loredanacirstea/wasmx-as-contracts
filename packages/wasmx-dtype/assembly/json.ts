import { JSON } from "assemblyscript-json/assembly";
import { Base64String } from "wasmx-env/assembly/types";
import { stringToBase64 } from "wasmx-utils/assembly/utils";
import { DTypeField, QueryParams } from "./types";
import { revert } from "./utils";



export function jsonToQueryParams(value: string, fields: DTypeField[]): QueryParams[] {
    // could be object or array
    if (value.substr(0, 1) == "[") {
        let arr: JSON.Arr = <JSON.Arr>(JSON.parse(value));
        return jsonToQueryParamsArr(arr, fields)
    }

    let jsonObj: JSON.Obj = <JSON.Obj>(JSON.parse(value));
    return [jsonToQueryParamsObj(jsonObj, fields)];
}

export function jsonToQueryParamsArr(jsonObj: JSON.Arr, fields: DTypeField[]): QueryParams[] {
    const result: QueryParams[] = []
    for (let i = 0; i < jsonObj._arr.length; i++) {
        const v = jsonObj._arr.at(i)
        if (!v.isObj) revert("unexpected value")
        const value: JSON.Obj = changetype<JSON.Obj>(v);
        result.push(jsonToQueryParamsObj(value, fields))
    }
    return result
}

export function jsonToQueryParamsObj(jsonObj: JSON.Obj, fields: DTypeField[]): QueryParams {
    const fieldMap = new Map<string,string>()
    for (let i = 0; i < fields.length; i++) {
        fieldMap.set(fields[i].name, fields[i].value_type);
    }
    const keys = jsonObj.keys
    const values: Base64String[] = []
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (!fieldMap.has(key)) {
            continue;
        }
        const valueType = fieldMap.get(key);
        const value = jsonObj.get(key)

        if (value == null) {
            values.push("");
            continue;
        }
        // TODO consider encoding to bytes each value
        if (value.isString) {
            // stringify escapes symbols
            values.push(stringToBase64(`{"type":"${valueType}","value":${value.stringify()}}`));
            continue;
        }
        if (value.isInteger) {
            values.push(stringToBase64(`{"type":"${valueType}","value":${value.stringify()}}`));
            continue;
        }
        if (value.isBool) {
            values.push(stringToBase64(`{"type":"${valueType}","value":${value.stringify()}}`));
            continue;
        }
        revert(`unexpected SQL parameter value: ${value.stringify()}`)
    }
    return new QueryParams(keys, values);
}
