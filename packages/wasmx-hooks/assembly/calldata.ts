import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgSetHook, MsgRunHook, QueryHookModulesRequest, QueryHooksRequest, MsgInitialize } from './types';

// @ts-ignore
@serializable
export class CallData {
    SetHook: MsgSetHook | null = null;
    RunHook: MsgRunHook | null = null;

    // query
    GetHooks: QueryHooksRequest | null = null;
    GetHookModules: QueryHookModulesRequest | null = null;
}

export function getCallDataInitialize(): MsgInitialize {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<MsgInitialize>(calldstr);
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
