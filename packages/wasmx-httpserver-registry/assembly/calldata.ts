import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { HttpRequestWrap } from "wasmx-env-httpclient/assembly/types";
import { CloseRequest, RemoveRouteHandlerRequest, SetRouteHandlerRequest, StartWebServerRequest } from "wasmx-env-httpserver/assembly/types";
import { SetRouteRequest } from "./types";

@json
export class MsgEmpty {}

@json
export class CallData {
    SetRoute: SetRouteRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
