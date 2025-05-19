import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { RolesChangedHook } from "wasmx-roles/assembly/types";
import { GetRouteRequest, GetRoutesRequest, RemoveRouteRequest, SetRouteRequest } from "./types";
import { CloseRequest, HttpRequestIncoming, StartWebServerRequest } from "wasmx-env-httpserver/assembly/types";

@json
export class MsgEmpty {}

@json
export class CallData {
    // private
    RoleChanged: RolesChangedHook | null = null;

    // public
    GetRoutes: GetRoutesRequest | null = null;
    GetRoute: GetRouteRequest | null = null;
    HttpRequestHandler: HttpRequestIncoming | null = null;

    SetRoute: SetRouteRequest | null = null;
    RemoveRoute: RemoveRouteRequest | null = null;

    StartWebServer: StartWebServerRequest | null = null;
    Close: CloseRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataWrapIncomingRequest(): HttpRequestIncoming {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<HttpRequestIncoming>(calldstr);
}
