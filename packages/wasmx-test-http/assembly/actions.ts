import { JSON } from "json-as";
import * as httpcw from "wasmx-env-httpclient/assembly/httpclient_wrap";
import * as httpsw from "wasmx-env-httpserver/assembly/httpserver_wrap";
import { HttpRequestWrap, HttpResponseWrap } from "wasmx-env-httpclient/assembly/types";
import { CloseRequest, CloseResponse, RemoveRouteHandlerRequest, RemoveRouteHandlerResponse, SetRouteHandlerRequest, SetRouteHandlerResponse, StartWebServerRequest, StartWebServerResponse } from "wasmx-env-httpserver/assembly/types";

export function HttpRequest(req: HttpRequestWrap): ArrayBuffer {
    const resp = httpcw.Request(req)
    return String.UTF8.encode(JSON.stringify<HttpResponseWrap>(resp))
}

export function StartWebServer(req: StartWebServerRequest): ArrayBuffer {
    const resp = httpsw.StartWebServer(req)
    return String.UTF8.encode(JSON.stringify<StartWebServerResponse>(resp))
}

export function SetRouteHandler(req: SetRouteHandlerRequest): ArrayBuffer {
    const resp = httpsw.SetRouteHandler(req)
    return String.UTF8.encode(JSON.stringify<SetRouteHandlerResponse>(resp))
}

export function RemoveRouteHandler(req: RemoveRouteHandlerRequest): ArrayBuffer {
    const resp = httpsw.RemoveRouteHandler(req)
    return String.UTF8.encode(JSON.stringify<RemoveRouteHandlerResponse>(resp))
}

export function Close(): ArrayBuffer {
    const resp = httpsw.Close()
    return String.UTF8.encode(JSON.stringify<CloseResponse>(resp))
}
