import { JSON } from "assemblyscript-json/assembly";
import { Base64String } from "wasmx-env/assembly/types";
import { stringToBase64 } from "wasmx-utils/assembly/utils";
import { DTypeField } from "./types";

export class QueryParams {
    keys: string[] = []
    values: Base64String[] = []
    constructor(keys: string[],  values: Base64String[]) {
        this.keys = keys
        this.values = values
    }
}

// TODO maybe same types as databases
export function jsonToQueryParams(value: string, fields: DTypeField[]): QueryParams {
    let jsonObj: JSON.Obj = <JSON.Obj>(JSON.parse(value));
    const fieldMap = new Map<string,string>()
    for (let i = 0; i < fields.length; i++) {
        fieldMap.set(fields[i].name, fields[i].value_type);
    }
    const keys = jsonObj.keys
    const values: Base64String[] = []
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        console.log("--key--" + key)
        if (!fieldMap.has(key)) {
            continue;
        }
        const valueType = fieldMap.get(key);
        const value = jsonObj.get(key)

        if (value == null) {
            values.push("");
            continue;
        }
        console.log("--value1--" + value.toString())
        console.log("--value2--" + value.stringify())
        if (value.isString) {
            console.log("--jsonToQueryParams2 value isString--" + value.toString())
            console.log("--jsonToQueryParams2 value isString--" + value.stringify())
            values.push(stringToBase64(`{"type":"${valueType}","value":"${value.toString()}"}`));
            continue;
        }
        if (value.isInteger) {
            console.log("--jsonToQueryParams2 value isInteger--" + value.toString())
            console.log("--jsonToQueryParams2 value isInteger--" + value.stringify())
            values.push(stringToBase64(`{"type":"${valueType}","value":${value.stringify()}}`));
            continue;
        }
        if (value.isBool) {
            values.push(stringToBase64(`{"type":"${valueType}","value":${value.stringify()}}`));
            continue;
        }
    }

    return new QueryParams(keys, values)
}
