import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCreateRoom, MsgSendMessage } from './types';

// @ts-ignore
@serializable
export class CallData {
    CreateRoom: MsgCreateRoom | null = null;
    SendMessage: MsgSendMessage | null = null;

}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
