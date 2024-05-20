import { JSON } from "json-as/assembly";
import { InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { InitSubChainRequest, MsgInitialize, QueryGetSubChainIdsRequest, QueryGetSubChainRequest, QueryGetSubChainsByIdsRequest, QueryGetSubChainsRequest, RegisterDefaultSubChainRequest, RegisterSubChainRequest, RegisterSubChainValidatorRequest, RemoveSubChainRequest } from "./types";

// @ts-ignore
@serializable
export class CallData {
    RegisterSubChain: RegisterSubChainRequest | null = null;
    RegisterDefaultSubChain: RegisterDefaultSubChainRequest | null = null;
    RemoveSubChain: RemoveSubChainRequest | null = null;
    RegisterSubChainValidator: RegisterSubChainValidatorRequest | null = null;
    InitSubChain: InitSubChainRequest | null = null;

    // query
    GetSubChains: QueryGetSubChainsRequest | null = null;
    GetSubChainsByIds: QueryGetSubChainsByIdsRequest | null = null;
    GetSubChainIds: QueryGetSubChainIdsRequest | null = null;
    GetSubChainById: QueryGetSubChainRequest | null = null;
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
