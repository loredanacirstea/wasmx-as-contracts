import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { HttpRequestWrap } from "wasmx-env-httpclient/assembly/types";

@json
export class MsgEmpty {}

@json
export class CallData {
    HttpRequest: HttpRequestWrap | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
