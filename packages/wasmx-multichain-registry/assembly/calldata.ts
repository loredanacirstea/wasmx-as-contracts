import { JSON } from "json-as/assembly";
import { InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { InitSubChainRequest, MsgInitialize, QueryConvertAddressByChainIdRequest, QueryGetSubChainIdsByLevelRequest, QueryGetSubChainIdsByValidatorRequest, QueryGetSubChainIdsRequest, QueryGetSubChainRequest, QueryGetSubChainsByIdsRequest, QueryGetSubChainsRequest, QueryGetValidatorsByChainIdRequest, QueryValidatorAddressesByChainIdRequest, RegisterDefaultSubChainRequest, RegisterSubChainRequest, RegisterSubChainValidatorRequest, RemoveSubChainRequest } from "./types";

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
    GetSubChainConfigById: QueryGetSubChainRequest | null = null;
    GetSubChainIdsByLevel: QueryGetSubChainIdsByLevelRequest | null = null;
    GetSubChainIdsByValidator: QueryGetSubChainIdsByValidatorRequest | null = null;
    GetValidatorsByChainId: QueryGetValidatorsByChainIdRequest | null = null;
    GetValidatorAddressesByChainId: QueryValidatorAddressesByChainIdRequest | null = null;
    ConvertAddressByChainId: QueryConvertAddressByChainIdRequest | null = null;
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
