import { JSON } from "json-as";
import * as httpw from "wasmx-env-http/assembly/http_wrap";
import { HttpRequestWrap, HttpResponseWrap } from "wasmx-env-http/assembly/types";

export function HttpRequest(req: HttpRequestWrap): ArrayBuffer {
    const resp = httpw.Request(req)
    return String.UTF8.encode(JSON.stringify<HttpResponseWrap>(resp))
}
