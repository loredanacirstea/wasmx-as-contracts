import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCreateValidator, MsgInitGenesis } from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: MsgInitGenesis | null = null;
    CreateValidator: MsgCreateValidator | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    calldstr = calldstr.replaceAll(`"@type"`, `"anytype"`)
    return JSON.parse<CallData>(calldstr);
}
