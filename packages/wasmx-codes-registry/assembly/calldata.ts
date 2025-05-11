import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgSetup } from "wasmx-env/assembly/types";
import { GenesisState, MsgSetCodeInfoRequest, MsgSetContractInfoRequest, MsgSetNewCodeInfoRequest, QueryCodeInfoRequest, QueryContractInfoRequest, QueryContractInstanceRequest } from './types';

@json
export class MsgEmpty {}

@json
export class CallData {
    // system
    setup: MsgSetup | null = null;

    NewCodeInfo: MsgSetNewCodeInfoRequest | null = null;
    SetCodeInfo: MsgSetCodeInfoRequest | null = null;
    SetContractInfo: MsgSetContractInfoRequest | null = null;

    // query
    GetCodeInfoPrefix: MsgEmpty | null = null;
    GetContractInfoPrefix: MsgEmpty | null = null;
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
