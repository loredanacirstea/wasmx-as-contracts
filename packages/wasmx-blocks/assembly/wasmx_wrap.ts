import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmx from './wasmx';
import { Base64String } from "./types";

// @ts-ignore
@serializable
class MerkleSlices {
	slices: string[] // base64 encoded
    constructor(slices: string[]) {
        this.slices = slices;
    }
}

// @ts-ignore
@serializable
class LoggerLog {
	msg: string
	parts: string[]
    constructor(msg: string, parts: string[]) {
        this.msg = msg;
        this.parts = parts;
    }
}

export function sstore(key: string, value: string): void {
    wasmx.storageStore(String.UTF8.encode(key), String.UTF8.encode(value));
}

export function sload(key: string): string {
    const value = wasmx.storageLoad(String.UTF8.encode(key));
    return String.UTF8.decode(value);
}

// base64 encoded
export function MerkleHash(slices: string[]): string {
    const data = new MerkleSlices(slices);
    const databz = String.UTF8.encode(JSON.stringify<MerkleSlices>(data));
    const resp = wasmx.MerkleHash(databz);
    return encodeBase64(Uint8Array.wrap(resp));
}

export function ed25519Sign(privKeyStr: string, msgstr: string): Base64String {
    const msgBase64 = Uint8Array.wrap(String.UTF8.encode(msgstr));
    const privKey = decodeBase64(privKeyStr);
    const signature = wasmx.ed25519Sign(privKey.buffer, msgBase64.buffer);
    return encodeBase64(Uint8Array.wrap(signature));
}

export function ed25519Verify(pubKeyStr: Base64String, signatureStr: Base64String, msg: string): boolean {
    const pubKey = decodeBase64(pubKeyStr);
    const signature = decodeBase64(signatureStr);
    const resp = wasmx.ed25519Verify(pubKey.buffer, signature.buffer, String.UTF8.encode(msg))
    if (resp == 1) return true;
    return false;
}

export function LoggerInfo(msg: string, parts: string[]): void {
    msg = `blocks: ${msg}`
    const data = new LoggerLog(msg, parts);
    const databz = String.UTF8.encode(JSON.stringify<LoggerLog>(data));
    wasmx.LoggerInfo(databz);
}

export function LoggerError(msg: string, parts: string[]): void {
    msg = `blocks: ${msg}`
    const data = new LoggerLog(msg, parts);
    const databz = String.UTF8.encode(JSON.stringify<LoggerLog>(data));
    wasmx.LoggerError(databz);
}

export function LoggerDebug(msg: string, parts: string[]): void {
    msg = `blocks: ${msg}`
    const data = new LoggerLog(msg, parts);
    const databz = String.UTF8.encode(JSON.stringify<LoggerLog>(data));
    wasmx.LoggerDebug(databz);
}
