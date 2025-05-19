import { JSON } from "json-as";
import * as httpcw from "wasmx-env-httpclient/assembly/httpclient_wrap";
import * as httpsw from "wasmx-env-httpserver/assembly/httpserver_wrap";
import * as httpc from "wasmx-env-httpclient/assembly/types";
import { CloseRequest, CloseResponse, HttpRequestIncoming, HttpResponse, HttpResponseWrap, RemoveRouteHandlerRequest, RemoveRouteHandlerResponse, SetRouteHandlerRequest, SetRouteHandlerResponse, StartWebServerRequest, StartWebServerResponse } from "wasmx-env-httpserver/assembly/types";
import { stringToBase64 } from "wasmx-utils/assembly/utils";

export function HttpRequest(req: httpc.HttpRequestWrap): ArrayBuffer {
    const resp = httpcw.Request(req)
    return String.UTF8.encode(JSON.stringify<httpc.HttpResponseWrap>(resp))
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

export function HttpRequestHandler(req: HttpRequestIncoming): ArrayBuffer {
    const headers = new Map<string,string[]>();
    headers.set("Content-Type", ["application/json"])
    const resp = new HttpResponseWrap("", new HttpResponse(
        "200 OK",
        200,
        headers,
        stringToBase64(`{"b":2}`),
    ))
    return String.UTF8.encode(JSON.stringify<HttpResponseWrap>(resp))
}
