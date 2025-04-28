import { JSON } from "assemblyscript-json/assembly";
import { Base64String } from "wasmx-env/assembly/types";
import { stringToBase64 } from "wasmx-utils/assembly/utils";

export class QueryParams {
    keys: string[] = []
    values: Base64String[] = []
    constructor(keys: string[],  values: Base64String[]) {
        this.keys = keys
        this.values = values
    }
}

// TODO maybe same types as databases
export function jsonToQueryParams(value: string): QueryParams {
    console.log("--jsonToQueryParams--" + value)
    let jsonObj: JSON.Obj = <JSON.Obj>(JSON.parse(value));
    console.log("--jsonToQueryParams keys--" + jsonObj.keys.length.toString() + "--" + jsonObj.keys.join(","))
    const keys = jsonObj.keys
    const values: Base64String[] = []
    for (let i = 0; i < keys.length; i++) {
        const value = jsonObj.get(keys[i])
        console.log("--key--" + keys[i])
        if (value == null) {
            values.push("");
            continue;
        }
        console.log("--value1--" + value.toString())
        console.log("--value2--" + value.stringify())
        if (value.isString) {
            console.log("--jsonToQueryParams2 value isString--" + value.toString())
            console.log("--jsonToQueryParams2 value isString--" + value.stringify())
            values.push(stringToBase64(`{"type":"string","value":"${value.toString()}"}`));
            continue;
        }
        if (value.isInteger) {
            console.log("--jsonToQueryParams2 value isInteger--" + value.toString())
            console.log("--jsonToQueryParams2 value isInteger--" + value.stringify())
            values.push(stringToBase64(`{"type":"string","value":${value.stringify()}}`));
            continue;
        }
        if (value.isBool) {
            values.push(stringToBase64(`{"type":"bool","value":${value.stringify()}}`));
            continue;
        }
    }

    return new QueryParams(keys, values)
}
