import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';

export function LoggerInfo(msg: string, parts: string[]): void {
    wasmxwrap.LoggerInfo("light_client", msg, parts)
}

export function LoggerError(msg: string, parts: string[]): void {
    wasmxwrap.LoggerError("light_client", msg, parts)
}

export function LoggerDebug(msg: string, parts: string[]): void {
    wasmxwrap.LoggerDebug("light_client", msg, parts)
}

export function LoggerDebugExtended(msg: string, parts: string[]): void {
    wasmxwrap.LoggerDebugExtended("light_client", msg, parts)
}

export function revert(message: string): void {
    LoggerError("revert", ["err", message])
    wasmx.revert(String.UTF8.encode(message));
    throw new Error(message);
}
