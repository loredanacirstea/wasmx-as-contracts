import { JSON } from "json-as";
import { LoggerDebugExtended } from "wasmx-env/assembly/wasmx_wrap"
import * as http from './httpserver';
import { CloseRequest, CloseResponse, GenerateJWTRequest, GenerateJWTResponse, MODULE_NAME, RemoveRouteHandlerRequest, RemoveRouteHandlerResponse, SetRouteHandlerRequest, SetRouteHandlerResponse, StartWebServerRequest, StartWebServerResponse, VerifyJWTRequest, VerifyJWTResponse } from "./types";

export function StartWebServer(req: StartWebServerRequest, moduleName: string = ""): StartWebServerResponse {
    const requestStr = JSON.stringify<StartWebServerRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "StartWebServer", ["request", requestStr])
    const responsebz = http.StartWebServer(String.UTF8.encode(requestStr));
    const resp = JSON.parse<StartWebServerResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function SetRouteHandler(req: SetRouteHandlerRequest, moduleName: string = ""): SetRouteHandlerResponse {
    const requestStr = JSON.stringify<SetRouteHandlerRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "SetRouteHandler", ["request", requestStr])
    const responsebz = http.SetRouteHandler(String.UTF8.encode(requestStr));
    const resp = JSON.parse<SetRouteHandlerResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function RemoveRouteHandler(req: RemoveRouteHandlerRequest, moduleName: string = ""): RemoveRouteHandlerResponse {
    const requestStr = JSON.stringify<RemoveRouteHandlerRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "RemoveRouteHandler", ["request", requestStr])
    const responsebz = http.RemoveRouteHandler(String.UTF8.encode(requestStr));
    const resp = JSON.parse<RemoveRouteHandlerResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Close(moduleName: string = ""): CloseResponse {
    const requestStr = JSON.stringify<CloseRequest>(new CloseRequest());
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Close", ["request", requestStr])
    const responsebz = http.Close(String.UTF8.encode(requestStr));
    const resp = JSON.parse<CloseResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function GenerateJWT(req: GenerateJWTRequest, moduleName: string = ""): GenerateJWTResponse {
    const requestStr = JSON.stringify<GenerateJWTRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "GenerateJWT", ["request", requestStr])
    const responsebz = http.GenerateJWT(String.UTF8.encode(requestStr));
    const resp = JSON.parse<GenerateJWTResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function VerifyJWT(req: VerifyJWTRequest, moduleName: string = ""): VerifyJWTResponse {
    const requestStr = JSON.stringify<VerifyJWTRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "VerifyJWT", ["request", requestStr])
    const responsebz = http.VerifyJWT(String.UTF8.encode(requestStr));
    const resp = JSON.parse<VerifyJWTResponse>(String.UTF8.decode(responsebz));
    return resp
}
