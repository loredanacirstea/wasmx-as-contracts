import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MODULE_NAME, NetworkNode } from './types';

export function LoggerInfo(msg: string, parts: string[]): void {
    wasmxwrap.LoggerInfo(MODULE_NAME, msg, parts)
}

export function LoggerError(msg: string, parts: string[]): void {
    wasmxwrap.LoggerError(MODULE_NAME, msg, parts)
}

export function LoggerDebug(msg: string, parts: string[]): void {
    wasmxwrap.LoggerDebug(MODULE_NAME, msg, parts)
}

export function LoggerDebugExtended(msg: string, parts: string[]): void {
    wasmxwrap.LoggerDebugExtended(MODULE_NAME, msg, parts)
}

export function revert(message: string): void {
    LoggerError("revert", ["err", message, "module", MODULE_NAME])
    wasmx.revert(String.UTF8.encode(message));
    throw new Error(message);
}

// "/ip4/127.0.0.1/tcp/5001/p2p/12D3KooWAWZ6M3FM34R3Fkx1za4WxUcRry2gmgxGoiVEE594oZXy"
export function getP2PAddress(node: NetworkNode): string {
    return `/ip4/${node.host}/tcp/${node.port}/p2p/${node.id}`
  }
