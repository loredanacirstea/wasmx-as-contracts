import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { Base64String, HexString } from 'wasmx-env/assembly/types';
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import { uint8ArrayToHex, hexToUint8Array } from 'wasmx-utils/assembly/utils';

export function base64ToHex(value: Base64String): HexString {
    return uint8ArrayToHex(decodeBase64(value))
}

export function hex64ToBase64(value: HexString): Base64String {
    return encodeBase64(hexToUint8Array(value))
}

export function LoggerInfo(msg: string, parts: string[]): void {
    wasmxwrap.LoggerInfo("derc20", msg, parts)
}

export function LoggerError(msg: string, parts: string[]): void {
    wasmxwrap.LoggerError("derc20", msg, parts)
}

export function LoggerDebug(msg: string, parts: string[]): void {
    wasmxwrap.LoggerDebug("derc20", msg, parts)
}

export function revert(message: string): void {
    LoggerError("revert", ["message", message])
    wasmx.revert(String.UTF8.encode(message));
    throw new Error(message);
}
