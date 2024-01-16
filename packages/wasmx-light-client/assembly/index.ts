import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallDataInstantiate, getCallDataWrap } from './calldata';
import {
    addHeaderWrap,
    getHeaderWrap,
} from './calldata';
import { setConfig } from './storage';
import { Config } from "./types";

export function wasmx_env_2(): void {}

export function instantiate(): void {
    const calldraw = wasmx.getCallData();
    const calld = JSON.parse<CallDataInstantiate>(String.UTF8.decode(calldraw));
    setConfig(new Config(calld.chainId));
}

export function main(): void {
    let result: ArrayBuffer = new ArrayBuffer(0);
    const calld = getCallDataWrap();
    if (calld.addHeader !== null) {
        result = addHeaderWrap(calld.addHeader!);
    } else if (calld.getHeader !== null) {
        result = getHeaderWrap(calld.getHeader!);
    } else {
        wasmx.revert(String.UTF8.encode("invalid function call data"));
        throw new Error("invalid function call data");
    }
    wasmx.finish(result);
}
