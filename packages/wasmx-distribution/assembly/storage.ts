import { JSON } from "json-as/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx_wrap";
import { Params } from "./types";

const PARAM_KEY = "params"

export function getParams(): Params {
    const value = wasmx.sload(PARAM_KEY);
    return JSON.parse<Params>(value);
}

export function getParamsInternal(): string {
    return wasmx.sload(PARAM_KEY);
}

export function setParams(params: Params): void {
    return wasmx.sstore(PARAM_KEY, JSON.stringify<Params>(params));
}


// delegatorAddress => withdrawAddress

// - withdraw commission
// - withdraw rewards

// - get current rewards
// - get validator commission
// - get delegator-validator rewards
// - get delegator total rewards
// - show delegator validators
// - show validator delegators
// - get withdraw address
