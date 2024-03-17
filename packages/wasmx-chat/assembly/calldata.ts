import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCreateRoom, MsgJoinRoom, MsgReceiveMessage, MsgSendMessage, QueryGetMessages, QueryGetRooms } from './types';
import { Base64String } from "wasmx-env/assembly/types";

// @ts-ignore
@serializable
export class StartNodeCalld {
    data: Base64String = ""
}

// @ts-ignore
@serializable
export class CallData {
    CreateRoom: MsgCreateRoom | null = null;
    JoinRoom: MsgJoinRoom | null = null;
    SendMessage: MsgSendMessage | null = null;
    ReceiveMessage: MsgReceiveMessage | null = null;

    // queries
    GetRooms: QueryGetRooms | null = null;
    GetMessages: QueryGetMessages | null = null;

    // consensusless hooks
    StartNode: StartNodeCalld | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
