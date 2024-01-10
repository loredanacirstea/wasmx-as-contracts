import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCreateValidator } from './types';

export class CallData {
    createValidator: MsgCreateValidator | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    return JSON.parse<CallData>(String.UTF8.decode(calldraw));
}
