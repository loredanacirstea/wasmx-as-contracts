import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { GenesisState, MsgSetCodeInfoRequest, MsgSetContractInfoRequest, MsgSetNewCodeInfoRequest, QueryCodeInfoRequest, QueryContractInfoRequest, QueryContractInstanceRequest } from './types';

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    NewCodeInfo: MsgSetNewCodeInfoRequest | null = null;
    SetCodeInfo: MsgSetCodeInfoRequest | null = null;
    SetContractInfo: MsgSetContractInfoRequest | null = null;

    // query
    GetLastCodeId: MsgEmpty | null = null;
    GetCodeInfo: QueryCodeInfoRequest | null = null;
    GetContractInfo: QueryContractInfoRequest | null = null;
    GetContractInstance: QueryContractInstanceRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataInstantiate(): GenesisState {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<GenesisState>(calldstr);
}
