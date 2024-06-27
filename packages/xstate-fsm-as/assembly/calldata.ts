import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { parseUint8ArrayToI32BigEndian } from 'wasmx-utils/assembly/utils';
import {
    EventObject,
    ContextParam,
    ActionObject,
} from './types';
import { MachineExternal } from './machine';
import { Base64String, CallRequest, CallResponse } from "wasmx-env/assembly/types";
import { LoggerDebug, LoggerDebugExtended } from "./utils";

export class InterpreterCallData {
    config: MachineExternal;
    calldata: CallData;
    constructor(config: MachineExternal, calldata: CallData) {
        this.config = config;
        this.calldata = calldata;
    }
}

// @ts-ignore
@serializable
export class HookCalld {
    data: Base64String = ""
}

// @ts-ignore
@serializable
export class CallData {
    setup: string | null = null;
    instantiate: CallDataInstantiate | null = null;
    getCurrentState: CallDataGetCurrentState | null = null;
    getContextValue: CallDataGetContextValue | null = null;
    run: CallDataRun | null = null;
    query: CallDataQuery | null = null;

    // consensusless hooks
    StartNode: HookCalld | null = null;
    SetupNode: HookCalld | null = null;
}

// @ts-ignore
@serializable
export class CallDataInstantiate {
    initialState: string;
    context: Array<ContextParam>;
    constructor(state: string, context: Array<ContextParam>) {
        this.initialState = state;
        this.context = context;
    }
}

// @ts-ignore
@serializable
export class CallDataGetCurrentState {}

// @ts-ignore
@serializable
export class CallDataGetContextValue {
    key: string;
    constructor(key: string) {
        this.key = key;
    }
}

// @ts-ignore
@serializable
export class CallDataRun {
    event: EventObject;
    constructor(event: EventObject) {
        this.event = event;
    }
}

// @ts-ignore
@serializable
export class CallDataQuery {
    action: ActionObject
    constructor(action: ActionObject) {
        this.action = action;
    }
}

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

export function getCallDataWrap(): InterpreterCallData {
    const icalld = getInterpreterCalldata();
    const configBz = icalld[0];
    const calldBz = icalld[1];
    const config = JSON.parse<MachineExternal>(String.UTF8.decode(configBz));
    const calldata = JSON.parse<CallData>(String.UTF8.decode(calldBz));
    return new InterpreterCallData(config, calldata);
}

export function getInterpreterCalldata(): Array<ArrayBuffer> {
    // configBz length + configBz + calldata length + calldata
    const calldraw = wasmx.getCallData();
    const configlenraw = calldraw.slice(0, 32);
    const configlen = parseUint8ArrayToI32BigEndian(Uint8Array.wrap(configlenraw.slice(28, 32)))
    const configBz = calldraw.slice(32, 32 + configlen)
    const calldlenraw = calldraw.slice(32 + configlen, 64 + configlen)
    const calldlen = parseUint8ArrayToI32BigEndian(Uint8Array.wrap(calldlenraw.slice(28, 32)))
    const calldBz = calldraw.slice(64 + configlen, 64 + configlen + calldlen)
    return [configBz, calldBz]
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
    LoggerDebugExtended("grpc request", ["request", reqstr])
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
    LoggerDebug("call", ["to", req.to, "response", String.UTF8.decode(responsebz)])
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
class StartTimeoutRequest {
	contract: string
	delay: i64
	args: Base64String
    constructor(contract: string, delay: i64, args: Base64String) {
        this.contract = contract
        this.delay = delay
        this.args = args
    }
}

export function startTimeout(contract: string, delayms: i64, args: string): void {
    const req = new StartTimeoutRequest(contract, delayms, encodeBase64(Uint8Array.wrap(String.UTF8.encode(args))));
    wasmx.startTimeout(String.UTF8.encode(JSON.stringify<StartTimeoutRequest>(req)));
}

export function addr_humanize(value: ArrayBuffer): string {
    const addr = wasmx.addr_humanize(value);
    return String.UTF8.decode(addr);
}

export function addr_canonicalize(value: string): ArrayBuffer {
    return wasmx.addr_canonicalize(String.UTF8.encode(value));
}
