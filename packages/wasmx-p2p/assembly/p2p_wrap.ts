import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64, decode } from "as-base64/assembly";
import * as p2p from './p2p';
import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import {WasmxResponse, StartNodeWithIdentityRequest, SendMessageRequest, ConnectPeersRequest, ConnectPeersResponse } from "./types";

export function StartNodeWithIdentity(req: StartNodeWithIdentityRequest): WasmxResponse {
    const data = JSON.stringify<StartNodeWithIdentityRequest>(req);
    const resp = p2p.StartNodeWithIdentity(String.UTF8.encode(data));
    return JSON.parse<WasmxResponse>(String.UTF8.decode(resp));
}

export function CloseNode(): WasmxResponse {
    const resp = p2p.CloseNode();
    return JSON.parse<WasmxResponse>(String.UTF8.decode(resp));
}

export function ConnectPeers(req: ConnectPeersRequest): ConnectPeersResponse {
    const data = JSON.stringify<ConnectPeersRequest>(req);
    const resp = p2p.ConnectPeers(String.UTF8.encode(data));
    return JSON.parse<ConnectPeersResponse>(String.UTF8.decode(resp));
}

export function SendMessage(req: SendMessageRequest): void {
    const data = JSON.stringify<SendMessageRequest>(req);
    p2p.SendMessage(String.UTF8.encode(data));
}

// export function Subscribe(req: SubscribeRequest): void {
//     const data = JSON.stringify<SubscribeRequest>(req);
//     p2p.Subscribe(String.UTF8.encode(data));
// }

export function LoggerInfo(msg: string, parts: string[]): void {
    wasmxwrap.LoggerInfo("wasmx_p2p", msg, parts)
}

export function LoggerError(msg: string, parts: string[]): void {
    wasmxwrap.LoggerError("wasmx_p2p", msg, parts)
}

export function LoggerDebug(msg: string, parts: string[]): void {
    wasmxwrap.LoggerDebug("wasmx_p2p", msg, parts)
}
