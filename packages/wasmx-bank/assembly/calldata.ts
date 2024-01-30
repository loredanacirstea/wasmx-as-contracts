import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgInitGenesis, MsgSend, MsgMultiSend, MsgUpdateParams, MsgSetSendEnabled } from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: MsgInitGenesis | null = null;
    Send: MsgSend | null = null;
    MultiSend: MsgMultiSend | null = null;
    UpdateParams: MsgUpdateParams | null = null;
    SetSendEnabled: MsgSetSendEnabled | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
