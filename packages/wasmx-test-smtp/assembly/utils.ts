import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MODULE_NAME } from './types';

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
    LoggerDebug("revert", ["err", message, "module", MODULE_NAME])
    wasmx.revert(String.UTF8.encode(message));
    throw new Error(message);
}
