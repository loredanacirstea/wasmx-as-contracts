import { JSON } from "json-as";
import { LoggerDebugExtended } from "wasmx-env/assembly/wasmx_wrap";
import * as sql from './postgresql';
import { MsgCloseRequest, MsgCloseResponse, MsgConnectRequestPostgresql, MsgConnectResponse, MsgExecuteBatchRequest, MsgExecuteBatchResponsePostgreSql, MsgExecuteRequest, MsgExecuteResponsePostgreSql, MsgPingRequest, MsgPingResponse, MsgQueryRequest, MsgQueryResponse, MsgCreateDatabaseRequest, MsgCreateDatabaseResponse } from "./types";

const MODULE_NAME = "wasmx-env-postgresql"

export function Connect(req: MsgConnectRequestPostgresql, moduleName: string = ""): MsgConnectResponse {
    const requestStr = JSON.stringify<MsgConnectRequestPostgresql>(req);
    LoggerDebugExtended(`${moduleName}:${MODULE_NAME}`, "Connect", ["request", requestStr])
    const responsebz = sql.Connect(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgConnectResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Close(req: MsgCloseRequest, moduleName: string = ""): MsgCloseResponse {
    const requestStr = JSON.stringify<MsgCloseRequest>(req);
    LoggerDebugExtended(`${moduleName}:${MODULE_NAME}`, "Close", ["request", requestStr])
    const responsebz = sql.Close(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgCloseResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Execute(req: MsgExecuteRequest, moduleName: string = ""): MsgExecuteResponsePostgreSql {
    const requestStr = JSON.stringify<MsgExecuteRequest>(req);
    LoggerDebugExtended(`${moduleName}:${MODULE_NAME}`, "Execute", ["request", requestStr])
    const responsebz = sql.Execute(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgExecuteResponsePostgreSql>(String.UTF8.decode(responsebz));
    return resp
}

export function BatchAtomic(req: MsgExecuteBatchRequest, moduleName: string = ""): MsgExecuteBatchResponsePostgreSql {
    const requestStr = JSON.stringify<MsgExecuteBatchRequest>(req);
    LoggerDebugExtended(`${moduleName}:${MODULE_NAME}`, "Batch", ["request", requestStr])
    const responsebz = sql.BatchAtomic(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgExecuteBatchResponsePostgreSql>(String.UTF8.decode(responsebz));
    return resp
}

export function Query(req: MsgQueryRequest, moduleName: string = ""): MsgQueryResponse {
    const requestStr = JSON.stringify<MsgQueryRequest>(req);
    LoggerDebugExtended(`${moduleName}:${MODULE_NAME}`, "Query", ["request", requestStr])
    const responsebz = sql.Query(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgQueryResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Ping(req: MsgPingRequest, moduleName: string = ""): MsgPingResponse {
    const requestStr = JSON.stringify<MsgPingRequest>(req);
    LoggerDebugExtended(`${moduleName}:${MODULE_NAME}`, "Ping", ["request", requestStr])
    const responsebz = sql.Ping(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgPingResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function CreateDatabase(req: MsgCreateDatabaseRequest, moduleName: string = ""): MsgCreateDatabaseResponse {
    const requestStr = JSON.stringify<MsgCreateDatabaseRequest>(req);
    LoggerDebugExtended(`${moduleName}:${MODULE_NAME}`, "CreateDatabase", ["request", requestStr])
    const responsebz = sql.CreateDatabase(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgCreateDatabaseResponse>(String.UTF8.decode(responsebz));
    return resp
}
