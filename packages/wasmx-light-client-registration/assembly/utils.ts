import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';

export function LoggerInfo(msg: string, parts: string[]): void {
    wasmxwrap.LoggerInfo("lc_registration", msg, parts)
}

export function LoggerError(msg: string, parts: string[]): void {
    wasmxwrap.LoggerError("lc_registration", msg, parts)
}

export function LoggerDebug(msg: string, parts: string[]): void {
    wasmxwrap.LoggerDebug("lc_registration", msg, parts)
}

export function revert(message: string): void {
    LoggerDebug("revert", ["err", message])
    wasmx.revert(String.UTF8.encode(message));
    throw new Error(message);
}
