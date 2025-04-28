import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallDataInstantiate, CloseRequest, ConnectRequest, CreateTableRequest, InsertRequest, ReadRequest, UpdateRequest } from "./types";

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    Initialize: CallDataInstantiate | null = null;
    CreateTable: CreateTableRequest | null = null;
    Connect: ConnectRequest | null = null;
    Close: CloseRequest | null = null;
    Insert: InsertRequest | null = null;
    Update: UpdateRequest | null = null;
    Read: ReadRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataInstantiateWrap(): CallDataInstantiate {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallDataInstantiate>(calldstr);
}
