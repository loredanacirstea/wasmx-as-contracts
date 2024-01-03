import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmx from './wasmx';
import {
    CallRequest,
    CallResponse,
    Base64String,
} from './types';

const MAX_LOGGED = 2000

// @ts-ignore
@serializable
export class WasmxLog {
    type: string = 'fsmvm';
    data: Uint8Array;
    topics: Array<Uint8Array>;
    constructor(data: Uint8Array, topics: Array<Uint8Array>) {
        this.data = data;
        this.topics = topics;
    }
}

export function sstore(key: string, value: string): void {
    wasmx.storageStore(String.UTF8.encode(key), String.UTF8.encode(value));
}

export function sload(key: string): string {
    const value = wasmx.storageLoad(String.UTF8.encode(key));
    return String.UTF8.decode(value);
}

export function intToString(value: i32): string {
    let vstr = value.toString(10);
    if (!vstr.includes(".")) return vstr;
    return vstr.substring(0, vstr.length - 2);
}

export function log_fsm(
    data: Uint8Array,
    topics: Array<Uint8Array>,
): void {
    const logs = new WasmxLog(data, topics)
    const logstr = JSON.stringify<WasmxLog>(logs);
    wasmx.log(String.UTF8.encode(logstr));
}

// @ts-ignore
@serializable
class GrpcResponse {
    data: string // base64
    error: string
    constructor(data: string, error: string) {
        this.data = data;
        this.error = error;
    }
}

export function grpcRequest(ip: string, contract: Uint8Array, data: string): GrpcResponse {
    const contractAddress = encodeBase64(contract);
    const reqstr = `{"ip_address":"${ip}","contract":"${contractAddress}","data":"${data}"}`
    console.debug("grpc request: " + reqstr.slice(0, MAX_LOGGED) + " [...]");
    const req = String.UTF8.encode(reqstr);
    const result = wasmx.grpcRequest(req);
    console.debug("grpc response: " + String.UTF8.decode(result));
    const response = JSON.parse<GrpcResponse>(String.UTF8.decode(result));
    if (response.error.length == 0) {
        response.data = String.UTF8.decode(decodeBase64(response.data).buffer);
    }
    console.debug("grpc response data: " + response.data);
    return response;
}

export function call(req: CallRequest): CallResponse {
    LoggerDebug("call", ["to", req.to, "calldata", req.calldata])
    req.calldata = encodeBase64(Uint8Array.wrap(String.UTF8.encode(req.calldata)))
    const requestStr = JSON.stringify<CallRequest>(req);
    const responsebz = wasmx.call(String.UTF8.encode(requestStr));
    return JSON.parse<CallResponse>(String.UTF8.decode(responsebz));
}

// base64 encoded data
export function sha256(base64Data: string): string {
    const buf = decodeBase64(base64Data);
    const res = wasmx.sha256(buf.buffer);
    return encodeBase64(Uint8Array.wrap(res));
}


// @ts-ignore
@serializable
class MerkleSlices {
	slices: string[] // base64 encoded
    constructor(slices: string[]) {
        this.slices = slices;
    }
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
    const signatureBase64 = encodeBase64(Uint8Array.wrap(signature));
    LoggerDebug("ed25519Sign", ["signature", signatureBase64])
    return signatureBase64
}

export function ed25519Verify(pubKeyStr: Base64String, signatureStr: Base64String, msg: string): boolean {
    const pubKey = decodeBase64(pubKeyStr);
    const signature = decodeBase64(signatureStr);
    LoggerDebug("ed25519Verify", ["signature", signatureStr, "pubKey", pubKeyStr])
    const resp = wasmx.ed25519Verify(pubKey.buffer, signature.buffer, String.UTF8.encode(msg));
    if (resp == 1) return true;
    return false;
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

export function LoggerInfo(msg: string, parts: string[]): void {
    msg = `raft: ${msg}`
    const data = new LoggerLog(msg, parts);
    const databz = String.UTF8.encode(JSON.stringify<LoggerLog>(data));
    wasmx.LoggerInfo(databz);
}

export function LoggerError(msg: string, parts: string[]): void {
    msg = `raft: ${msg}`
    const data = new LoggerLog(msg, parts);
    const databz = String.UTF8.encode(JSON.stringify<LoggerLog>(data));
    wasmx.LoggerError(databz);
}

export function LoggerDebug(msg: string, parts: string[]): void {
    msg = `raft: ${msg}`
    const data = new LoggerLog(msg, parts);
    const databz = String.UTF8.encode(JSON.stringify<LoggerLog>(data));
    wasmx.LoggerDebug(databz);
}

export function addr_humanize(value: ArrayBuffer): string {
    const addr = wasmx.addr_humanize(value);
    return String.UTF8.decode(addr);
}

export function addr_canonicalize(value: string): ArrayBuffer {
    return wasmx.addr_canonicalize(String.UTF8.encode(value));
}
