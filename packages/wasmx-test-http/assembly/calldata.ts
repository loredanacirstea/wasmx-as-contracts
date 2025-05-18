import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { HttpRequestWrap } from "wasmx-env-httpclient/assembly/types";
import { CloseRequest, RemoveRouteHandlerRequest, SetRouteHandlerRequest, StartWebServerRequest } from "wasmx-env-httpserver/assembly/types";

@json
export class MsgEmpty {}

@json
export class CallData {
    HttpRequest: HttpRequestWrap | null = null;
    StartWebServer: StartWebServerRequest | null = null;
    SetRouteHandler: SetRouteHandlerRequest | null = null;
    RemoveRouteHandler: RemoveRouteHandlerRequest | null = null;
    Close: CloseRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
