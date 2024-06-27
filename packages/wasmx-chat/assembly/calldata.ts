import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgJoinRoom, MsgSendMessage, QueryGetBlock, QueryGetBlocks, QueryGetMessage, QueryGetMessages, QueryGetRooms } from './types';
import { Base64String } from "wasmx-env/assembly/types";

// @ts-ignore
@serializable
export class HookCalld {
    data: Base64String = ""
}

// @ts-ignore
@serializable
export class CallData {
    HandleTx: Base64String | null = null;

    // queries
    GetRooms: QueryGetRooms | null = null;
    GetMessages: QueryGetMessages | null = null;
    GetMessage: QueryGetMessage | null = null;
    GetBlocks: QueryGetBlocks | null = null;
    GetBlock: QueryGetBlock | null = null;

    // consensusless hooks
    StartNode: HookCalld | null = null;
}

// @ts-ignore
@serializable
export class CallDataInternal {
    JoinRoom: MsgJoinRoom | null = null;
    SendMessage: MsgSendMessage | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataInternal(data: string): CallDataInternal {
    return JSON.parse<CallDataInternal>(data);
}
