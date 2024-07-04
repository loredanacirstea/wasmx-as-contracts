import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxt from "wasmx-env/assembly/types";
import { MsgInitialize, MsgSetChainDataRequest, QueryGetChainDataRequest, QueryGetSubChainRequest } from "./types";
import { Base64String } from "wasmx-env/assembly/types";

// @ts-ignore
@serializable
export class HookCalld {
    data: Base64String = ""
}

// @ts-ignore
@serializable
export class CallData {
    SetChainData: MsgSetChainDataRequest | null = null;

    // queries
    GetChainData: QueryGetChainDataRequest | null = null
    GetSubChainConfigById: QueryGetSubChainRequest | null = null;  // common registry API used by mythos cli

    // consensusless hooks
    NewSubChain: HookCalld | null = null;

    // crosschain
    CrossChainTx: wasmxt.MsgCrossChainCallRequest | null = null;
    CrossChainQuery: wasmxt.MsgCrossChainCallRequest | null = null;
    CrossChainQueryNonDeterministic: wasmxt.MsgCrossChainCallRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataInitialize(): MsgInitialize {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<MsgInitialize>(calldstr);
}
