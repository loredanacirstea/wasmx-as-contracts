import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgInitGenesis, MsgSetHook, MsgRunHook, QueryHookModulesRequest, QueryHooksRequest } from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: MsgInitGenesis | null = null;
    SetHook: MsgSetHook | null = null;
    RunHook: MsgRunHook | null = null;

    // query
    GetHooks: QueryHooksRequest | null = null;
    GetHookModules: QueryHookModulesRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
