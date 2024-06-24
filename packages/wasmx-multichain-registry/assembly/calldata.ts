import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxt from "wasmx-env/assembly/types";
import { InitSubChainRequest, MsgInitialize, QueryBuildGenAtomicLevelRegistrationRequest, QueryConvertAddressByChainIdRequest, QueryGetCurrentLevelRequest, QueryGetSubChainIdsByLevelRequest, QueryGetSubChainIdsByValidatorRequest, QueryGetSubChainIdsRequest, QueryGetSubChainRequest, QueryGetSubChainsByIdsRequest, QueryGetSubChainsRequest, QueryGetValidatorsByChainIdRequest, QueryRegisterDescendantChainRequest, QueryRegisterWithProgenitorChainRequest, QueryValidatorAddressesByChainIdRequest, RegisterDefaultSubChainRequest, RegisterSubChainRequest, RegisterSubChainValidatorRequest, RemoveSubChainRequest } from "./types";

// @ts-ignore
@serializable
export class CallData {
    RegisterSubChain: RegisterSubChainRequest | null = null;
    RegisterDefaultSubChain: RegisterDefaultSubChainRequest | null = null;
    RemoveSubChain: RemoveSubChainRequest | null = null;
    RegisterSubChainValidator: RegisterSubChainValidatorRequest | null = null;
    InitSubChain: InitSubChainRequest | null = null;

    // query
    GetCurrentLevel: QueryGetCurrentLevelRequest | null = null;
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

    // crosschain
    CrossChainTx: wasmxt.MsgCrossChainCallRequest | null = null;
    CrossChainQuery: wasmxt.MsgCrossChainCallRequest | null = null;
    CrossChainQueryNonDeterministic: wasmxt.MsgCrossChainCallRequest | null = null;

    // crosschain query
    BuildGenAtomicLevelRegistration: QueryBuildGenAtomicLevelRegistrationRequest | null = null;
    RegisterWithProgenitorChain: QueryRegisterWithProgenitorChainRequest | null = null;
}

// @ts-ignore
@serializable
export class CallDataCrossChain {
    RegisterDescendantChain: QueryRegisterDescendantChainRequest | null = null;
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

export function getCallDataCrossChain(): wasmxt.MsgCrossChainCallRequest {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<wasmxt.MsgCrossChainCallRequest>(calldstr);
}
