import { JSON } from "json-as/assembly";
import { LoggerDebugExtended } from "wasmx-env/assembly/wasmx_wrap"
import * as imap from './imap';
import { Email, ImapCloseRequest, ImapCloseResponse, ImapConnectionOauth2Request, ImapConnectionResponse, ImapConnectionSimpleRequest, ImapCreateFolderRequest, ImapCreateFolderResponse, ImapFetchRequest, ImapFetchResponse, ImapListenRequest, ImapListenResponse, MODULE_NAME } from "./types";

export function ConnectWithPassword(req: ImapConnectionSimpleRequest, moduleName: string = ""): ImapConnectionResponse {
    const requestStr = JSON.stringify<ImapConnectionSimpleRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "ConnectWithPassword", ["request", requestStr])
    const responsebz = imap.ConnectWithPassword(String.UTF8.encode(requestStr));
    const resp = JSON.parse<ImapConnectionResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function ConnectOAuth2(req: ImapConnectionOauth2Request, moduleName: string = ""): ImapConnectionResponse {
    const requestStr = JSON.stringify<ImapConnectionOauth2Request>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "ConnectOAuth2", ["request", requestStr])
    const responsebz = imap.ConnectOAuth2(String.UTF8.encode(requestStr));
    const resp = JSON.parse<ImapConnectionResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Close(req: ImapCloseRequest, moduleName: string = ""): ImapCloseResponse {
    const requestStr = JSON.stringify<ImapCloseRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Close", ["request", requestStr])
    const responsebz = imap.Close(String.UTF8.encode(requestStr));
    const resp = JSON.parse<ImapCloseResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Fetch(req: ImapFetchRequest, moduleName: string = ""): ImapFetchResponse {
    const requestStr = JSON.stringify<ImapFetchRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Fetch", ["request", requestStr])
    const responsebz = imap.Fetch(String.UTF8.encode(requestStr));
    const resp = JSON.parse<ImapFetchResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function Listen(req: ImapListenRequest, moduleName: string = ""): ImapListenResponse {
    const requestStr = JSON.stringify<ImapListenRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "Listen", ["request", requestStr])
    const responsebz = imap.Listen(String.UTF8.encode(requestStr));
    const resp = JSON.parse<ImapListenResponse>(String.UTF8.decode(responsebz));
    return resp
}

export function CreateFolder(req: ImapCreateFolderRequest, moduleName: string = ""): ImapCreateFolderResponse {
    const requestStr = JSON.stringify<ImapCreateFolderRequest>(req);
    LoggerDebugExtended(`${MODULE_NAME}:${moduleName}`, "CreateFolder", ["request", requestStr])
    const responsebz = imap.CreateFolder(String.UTF8.encode(requestStr));
    const resp = JSON.parse<ImapCreateFolderResponse>(String.UTF8.decode(responsebz));
    return resp
}
