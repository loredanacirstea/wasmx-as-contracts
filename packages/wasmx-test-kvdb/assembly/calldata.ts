import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { KvDeleteRequest, KvGetRequest, KvHasRequest, KvIteratorRequest, KvSetRequest, MsgCloseRequest, MsgConnectRequest } from "wasmx-env-kvdb/assembly/types";
import { MsgNestedCall } from "./types";

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    Connect: MsgConnectRequest | null = null;
    Close: MsgCloseRequest | null = null;
    Get: KvGetRequest | null = null;
    Has: KvHasRequest | null = null;
    Set: KvSetRequest | null = null;
    Delete: KvDeleteRequest | null = null;
    Iterator: KvIteratorRequest | null = null;
    NestedCall: MsgNestedCall | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
