import { JSON } from "json-as/assembly";
import * as sql from './sql';
import { MODULE_NAME, MsgCloseRequest, MsgCloseResponse, MsgConnectRequest, MsgConnectResponse, MsgExecuteBatchRequest, MsgExecuteBatchResponse, MsgExecuteRequest, MsgExecuteResponse, MsgPingRequest, MsgPingResponse, MsgQueryRequest, MsgQueryResponse } from "./types";

export function Connect(req: MsgConnectRequest, moduleName: string = ""): MsgConnectResponse {
    const requestStr = JSON.stringify<MsgConnectRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Connect", ["request", requestStr])
    const responsebz = sql.Connect(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgConnectResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Close(req: MsgCloseRequest, moduleName: string = ""): MsgCloseResponse {
    const requestStr = JSON.stringify<MsgCloseRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Close", ["request", requestStr])
    const responsebz = sql.Close(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgCloseResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Execute(req: MsgExecuteRequest, moduleName: string = ""): MsgExecuteResponse {
    const requestStr = JSON.stringify<MsgExecuteRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Execute", ["request", requestStr])
    const responsebz = sql.Execute(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgExecuteResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function BatchAtomic(req: MsgExecuteBatchRequest, moduleName: string = ""): MsgExecuteBatchResponse {
    const requestStr = JSON.stringify<MsgExecuteBatchRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Batch", ["request", requestStr])
    const responsebz = sql.BatchAtomic(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgExecuteBatchResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Query(req: MsgQueryRequest, moduleName: string = ""): MsgQueryResponse {
    const requestStr = JSON.stringify<MsgQueryRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Query", ["request", requestStr])
    const responsebz = sql.Query(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgQueryResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Ping(req: MsgPingRequest, moduleName: string = ""): MsgPingResponse {
    const requestStr = JSON.stringify<MsgPingRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Ping", ["request", requestStr])
    const responsebz = sql.Ping(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgPingResponse>(String.UTF8.decode(responsebz));
    return resp
}
