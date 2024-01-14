import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallDataInstantiate, getCallDataWrap } from './calldata';
import {
    registerChainWrap,
    registerValidatorWrap,
    addHeaderWrap,
    getNextProposerWrap,
} from './calldata';
import { setConfig } from './storage';
import { Config } from "./types";

export function wasmx_env_2(): void {}

export function instantiate(): void {
    const calldraw = wasmx.getCallData();
    const calld = JSON.parse<CallDataInstantiate>(String.UTF8.decode(calldraw));
    setConfig(new Config(calld.min_validators));
}

export function main(): void {
    let result: ArrayBuffer = new ArrayBuffer(0);
    const calld = getCallDataWrap();
    if (calld.registerChain !== null) {
        result = registerChainWrap(calld.registerChain!);
    } else if (calld.registerValidator !== null) {
        result = registerValidatorWrap(calld.registerValidator!);
    } else if (calld.addHeader !== null) {
        result = addHeaderWrap(calld.addHeader!);
    } else if (calld.getNextProposer !== null) {
        result = getNextProposerWrap(calld.getNextProposer!);
    } else {
        wasmx.revert(String.UTF8.encode("invalid function call data"));
        throw new Error("invalid function call data");
    }
    wasmx.finish(result);
}
