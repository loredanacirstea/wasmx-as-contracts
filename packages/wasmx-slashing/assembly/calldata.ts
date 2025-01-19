import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as stakingtypes from "wasmx-stake/assembly/types"
import { GenesisState, MsgRunHook, QueryMissedBlockBitmapRequest, QueryParamsRequest, QuerySigningInfoRequest, QuerySigningInfosRequest } from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: GenesisState | null = null;

    // query
    SigningInfo: QuerySigningInfoRequest | null = null;
    SigningInfos: QuerySigningInfosRequest | null = null;
    Params: QueryParamsRequest | null = null;
    GetMissedBlockBitmap: QueryMissedBlockBitmapRequest | null = null;

    Unjail: stakingtypes.MsgUnjail | null = null;

    // hook
    BeginBlock: MsgRunHook | null = null;
    AfterValidatorCreated: MsgRunHook | null = null;
    AfterValidatorBonded: MsgRunHook | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
