import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCreateValidator, GenesisState, MsgGetAllValidators, MsgUpdateValidators, QueryValidatorRequest, QueryDelegationRequest, QueryPoolRequest, QueryValidatorDelegationsRequest, QueryDelegatorValidatorsRequest, QueryParamsRequest } from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: GenesisState | null = null;
    CreateValidator: MsgCreateValidator | null = null;
    GetAllValidators: MsgGetAllValidators | null = null;
    UpdateValidators: MsgUpdateValidators | null = null;

    // query
    Params: QueryParamsRequest | null = null;
    GetValidator: QueryValidatorRequest | null = null;
    GetDelegation: QueryDelegationRequest | null = null;
    GetPool: QueryPoolRequest | null = null;
    ValidatorByConsAddr: QueryValidatorRequest | null = null;
    ValidatorByHexAddr: QueryValidatorRequest | null = null;
    GetValidatorDelegations: QueryValidatorDelegationsRequest | null = null;
    GetDelegatorValidators: QueryDelegatorValidatorsRequest | null = null;
    GetDelegatorValidatorAddresses: QueryDelegatorValidatorsRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
