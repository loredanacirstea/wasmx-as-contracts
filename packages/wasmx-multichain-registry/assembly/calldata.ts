import { JSON } from "json-as/assembly";
import { InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import * as wasmx from 'wasmx-env/assembly/wasmx';

// @ts-ignore
@serializable
export class CallData {
    InitSubChain: InitSubChainDeterministicRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
