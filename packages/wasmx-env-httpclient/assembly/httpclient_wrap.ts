import { JSON } from "json-as";
import { LoggerDebugExtended } from "wasmx-env/assembly/wasmx_wrap"
import * as http from './httpclient';
import { HttpRequestWrap, HttpResponseWrap, MODULE_NAME } from "./types";

export function Request(req: HttpRequestWrap, moduleName: string = ""): HttpResponseWrap {
    const requestStr = JSON.stringify<HttpRequestWrap>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Request", ["request", requestStr])
    const responsebz = http.Request(String.UTF8.encode(requestStr));
    const resp = JSON.parse<HttpResponseWrap>(String.UTF8.decode(responsebz));
    return resp
}
