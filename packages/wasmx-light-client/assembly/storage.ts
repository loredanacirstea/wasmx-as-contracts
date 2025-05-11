import { JSON } from "json-as";
import * as wasmxwrap from "wasmx-env/assembly/wasmx_wrap";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { Config } from "./types";
import { LoggerDebug, LoggerInfo, LoggerError, revert } from "./utils";

// storage keys
const CONFIG_KEY = "config";
const LAST_HEADER_KEY = "lastindex";
const HEADER_KEY = "header_";


export function getLastHeaderIndex(): i64 {
    const valuestr = wasmxwrap.sload(LAST_HEADER_KEY);
    if (valuestr != "") {
        const value = parseInt(valuestr);
        return i64(value);
    }
    return i64(0);
}

export function setLastHeaderIndex(value: i64): void {
    LoggerDebug("setting header count", ["height", value.toString()])
    wasmxwrap.sstore(LAST_HEADER_KEY, value.toString());
}

export function getConfig(): Config {
    const value = wasmxwrap.sload(CONFIG_KEY);
    if (value == "") return new Config("");
    return JSON.parse<Config>(value);
}

export function setConfig(value: Config) {
    wasmxwrap.sstore(CONFIG_KEY, JSON.stringify<Config>(value));
}

export function getHeaderObj(index: i64): typestnd.Header | null {
    const value = getHeader(index);
    if (value == "") return null;
    return JSON.parse<typestnd.Header>(value!);
}

export function getHeader(index: i64): string {
    return wasmxwrap.sload(HEADER_KEY + index.toString());
}

export function addHeader(header: typestnd.Header) {
    wasmxwrap.sstore(HEADER_KEY + header.height.toString(), JSON.stringify<typestnd.Header>(header));
}
