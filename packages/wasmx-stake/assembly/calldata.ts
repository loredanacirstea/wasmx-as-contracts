import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCreateValidator, MsgInitGenesis, MsgGetAllValidators, MsgUpdateValidators, QueryValidatorRequest, QueryDelegationRequest, QueryPoolRequest } from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: MsgInitGenesis | null = null;
    CreateValidator: MsgCreateValidator | null = null;
    GetAllValidators: MsgGetAllValidators | null = null;
    UpdateValidators: MsgUpdateValidators | null = null;

    // query
    GetValidator: QueryValidatorRequest | null = null;
    GetDelegation: QueryDelegationRequest | null = null;
    GetPool: QueryPoolRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    calldstr = calldstr.replaceAll(`"@type"`, `"anytype"`)
    return JSON.parse<CallData>(calldstr);
}
