import { JSON } from "json-as";
import * as kvdb from './kvdb';
import { KvDeleteRequest, KvDeleteResponse, KvGetRequest, KvGetResponse, KvHasRequest, KvHasResponse, KvIteratorRequest, KvIteratorResponse, KvSetRequest, KvSetResponse, MODULE_NAME, MsgCloseRequest, MsgCloseResponse, MsgConnectRequest, MsgConnectResponse } from "./types";

export function Connect(req: MsgConnectRequest, moduleName: string = ""): MsgConnectResponse {
    const requestStr = JSON.stringify<MsgConnectRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Connect", ["request", requestStr])
    const responsebz = kvdb.Connect(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgConnectResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Close(req: MsgCloseRequest, moduleName: string = ""): MsgCloseResponse {
    const requestStr = JSON.stringify<MsgCloseRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Close", ["request", requestStr])
    const responsebz = kvdb.Close(String.UTF8.encode(requestStr));
    const resp = JSON.parse<MsgCloseResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Get(req: KvGetRequest, moduleName: string = ""): KvGetResponse {
    const requestStr = JSON.stringify<KvGetRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Get", ["request", requestStr])
    const responsebz = kvdb.Get(String.UTF8.encode(requestStr));
    const resp = JSON.parse<KvGetResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Has(req: KvHasRequest, moduleName: string = ""): KvHasResponse {
    const requestStr = JSON.stringify<KvHasRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Has", ["request", requestStr])
    const responsebz = kvdb.Has(String.UTF8.encode(requestStr));
    const resp = JSON.parse<KvHasResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Set(req: KvSetRequest, moduleName: string = ""): KvSetResponse {
    const requestStr = JSON.stringify<KvSetRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Set", ["request", requestStr])
    const responsebz = kvdb.Set(String.UTF8.encode(requestStr));
    const resp = JSON.parse<KvSetResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Delete(req: KvDeleteRequest, moduleName: string = ""): KvDeleteResponse {
    const requestStr = JSON.stringify<KvDeleteRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Delete", ["request", requestStr])
    const responsebz = kvdb.Delete(String.UTF8.encode(requestStr));
    const resp = JSON.parse<KvDeleteResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Iterator(req: KvIteratorRequest, moduleName: string = ""): KvIteratorResponse {
    const requestStr = JSON.stringify<KvIteratorRequest>(req);
    // LoggerDebugExtended(`${MODULE_NAME}`, "Iterator", ["request", requestStr])
    const responsebz = kvdb.Iterator(String.UTF8.encode(requestStr));
    const resp = JSON.parse<KvIteratorResponse>(String.UTF8.decode(responsebz));
    return resp
}
