import { JSON } from "json-as";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Params } from "./types";

const PARAM_KEY = "params"

export function getParams(): Params {
    const value = wasmxw.sload(PARAM_KEY);
    return JSON.parse<Params>(value);
}

export function getParamsInternal(): string {
    return wasmxw.sload(PARAM_KEY);
}

export function setParams(params: Params): void {
    return wasmxw.sstore(PARAM_KEY, JSON.stringify<Params>(params));
}

