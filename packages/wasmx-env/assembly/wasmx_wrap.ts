import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmx from './wasmx';
import {
    CallRequest,
    CallResponse,
    Base64String,
    WasmxLog,
    GrpcResponse,
    MerkleSlices,
    StartTimeoutRequest,
    LoggerLog,
    Bech32String,
    Account,
    CreateAccountRequest,
    CreateAccountResponse,
    Create2AccountRequest,
    Create2AccountResponse,
    Event,
    StorageRange,
    StoragePairs,
    StoragePair,
    SignedTransaction,
    VerifyCosmosTxResponse,
    BlockInfo,
    HexString,
    StartBackgroundProcessRequest,
    StartBackgroundProcessResponse,
    WriteToBackgroundProcessRequest,
    WriteToBackgroundProcessResponse,
    ReadFromBackgroundProcessRequest,
    ReadFromBackgroundProcessResponse,
} from './types';
import { u8ArrayToHex, uint8ArrayToHex } from "as-tally/assembly/tally";
import { toUpperCase } from "./utils";
import { PrefixedAddress } from "./wasmx_types";

export const MODULE_NAME = "wasmx-env"


export function LoggerInfo(module: string, msg: string, parts: string[]): void {
    msg = `${module}: ${msg}`
    const data = new LoggerLog(msg, parts);
    const databz = String.UTF8.encode(JSON.stringify<LoggerLog>(data));
    wasmx.LoggerInfo(databz);
}

export function LoggerError(module: string, msg: string, parts: string[]): void {
    msg = `${module}: ${msg}`
    const data = new LoggerLog(msg, parts);
    const databz = String.UTF8.encode(JSON.stringify<LoggerLog>(data));
    wasmx.LoggerError(databz);
}

export function LoggerDebug(module: string, msg: string, parts: string[]): void {
    msg = `${module}: ${msg}`
    const data = new LoggerLog(msg, parts);
    const databz = String.UTF8.encode(JSON.stringify<LoggerLog>(data));
    wasmx.LoggerDebug(databz);
}

export function LoggerDebugExtended(module: string, msg: string, parts: string[]): void {
    msg = `${module}: ${msg}`
    const data = new LoggerLog(msg, parts);
    const databz = String.UTF8.encode(JSON.stringify<LoggerLog>(data));
    wasmx.LoggerDebugExtended(databz);
}

function LoggerInfoWrap(msg: string, parts: string[]): void {
    LoggerInfo(MODULE_NAME, msg, parts)
}

function LoggerErrorWrap(msg: string, parts: string[]): void {
    LoggerError(MODULE_NAME, msg, parts)
}

function LoggerDebugWrap(msg: string, parts: string[]): void {
    LoggerDebug(MODULE_NAME, msg, parts)
}

function LoggerDebugExtendedWrap(msg: string, parts: string[]): void {
    LoggerDebugExtended(MODULE_NAME, msg, parts)
}

export function revert(message: string): void {
    // console.debug(`Error: ${message}`);
    LoggerErrorWrap("revert", ["message", message])
    wasmx.revert(String.UTF8.encode(message));
    throw new Error(message);
}

export function sstore(key: string, value: string): void {
    wasmx.storageStore(String.UTF8.encode(key), String.UTF8.encode(value));
}

export function sload(key: string): string {
    const value = wasmx.storageLoad(String.UTF8.encode(key));
    return String.UTF8.decode(value);
}

/// storageLoadRangePairs

export function sloadRangeStringKeys(keyStart: string, keyEnd: string, reverse: bool): Base64String[] {
    return sloadRange(
        encodeBase64(Uint8Array.wrap(String.UTF8.encode(keyStart))),
        encodeBase64(Uint8Array.wrap(String.UTF8.encode(keyEnd))),
        reverse,
    )
}

export function sloadRange(keyStart: Base64String, keyEnd: Base64String, reverse: bool): Base64String[] {
    const req = new StorageRange(keyStart, keyEnd, reverse)
    const value = wasmx.storageLoadRange(String.UTF8.encode(JSON.stringify<StorageRange>(req)));
    const responseStr = String.UTF8.decode(value);
    return JSON.parse<Array<Base64String>>(responseStr);
}

export function sloadRangePairs(keyStart: Base64String, keyEnd: Base64String, reverse: bool): StoragePair[] {
    const req = new StorageRange(keyStart, keyEnd, reverse)
    const value = wasmx.storageLoadRangePairs(String.UTF8.encode(JSON.stringify<StorageRange>(req)));
    const responseStr = String.UTF8.decode(value);
    const response = JSON.parse<StoragePairs>(responseStr);
    return response.values
}

export function getAccount(addr: Bech32String): Account {
    const acc = wasmx.getAccount(addr_canonicalize(addr));
    return JSON.parse<Account>(String.UTF8.decode(acc));
}

export function intToString(value: i32): string {
    let vstr = value.toString(10);
    if (!vstr.includes(".")) return vstr;
    return vstr.substring(0, vstr.length - 2);
}

export function log(
    data: Uint8Array,
    topics: Array<Uint8Array>,
): void {
    const logs = new WasmxLog(data, topics)
    const logstr = JSON.stringify<WasmxLog>(logs);
    wasmx.log(String.UTF8.encode(logstr));
}

export function logWithMsgTopic(
    msg: string,
    data: Uint8Array,
    topics: Array<Uint8Array>,
): void {
    const topic0 = wasmx.sha256(String.UTF8.encode(encodeBase64(Uint8Array.wrap(String.UTF8.encode(msg)))))
    const newtopics = new Array<Uint8Array>(topics.length + 1)
    newtopics[0] = Uint8Array.wrap(topic0)
    for (let i = 0; i < topics.length; i++) {
        newtopics[i + 1] = topics[i];
    }
    log(data, newtopics)
}

export function emitCosmosEvents(events: Event[]): void {
    wasmx.emitCosmosEvents(String.UTF8.encode(JSON.stringify<Event[]>(events)))
}

export function grpcRequest(ip: string, contract: Uint8Array, data: string): GrpcResponse {
    const contractAddress = encodeBase64(contract);
    const reqstr = `{"ip_address":"${ip}","contract":"${contractAddress}","data":"${data}"}`
    LoggerDebugExtendedWrap("grpc request: ", ["request", reqstr]);
    const req = String.UTF8.encode(reqstr);
    const result = wasmx.grpcRequest(req);
    LoggerDebugExtendedWrap("grpc request: ", ["response",  String.UTF8.decode(result)]);
    const response = JSON.parse<GrpcResponse>(String.UTF8.decode(result));
    if (response.error.length == 0) {
        response.data = String.UTF8.decode(decodeBase64(response.data).buffer);
    }
    console.debug("grpc response data: " + response.data);
    return response;
}

export function call(req: CallRequest, moduleName: string = ""): CallResponse {
    LoggerDebug(`${moduleName}:wasmx_env`, "call", ["to", req.to, "calldata", req.calldata])
    req.calldata = encodeBase64(Uint8Array.wrap(String.UTF8.encode(req.calldata)))
    const requestStr = JSON.stringify<CallRequest>(req);
    const responsebz = wasmx.call(String.UTF8.encode(requestStr));
    return JSON.parse<CallResponse>(String.UTF8.decode(responsebz));
}

export function callEvm(req: CallRequest, moduleName: string = ""): CallResponse {
    LoggerDebug(`${moduleName}:wasmx_env`, "call", ["to", req.to, "calldata", req.calldata])
    const requestStr = JSON.stringify<CallRequest>(req);
    const responsebz = wasmx.call(String.UTF8.encode(requestStr));
    return JSON.parse<CallResponse>(String.UTF8.decode(responsebz));
}

export function createAccount(req: CreateAccountRequest, moduleName: string = ""): Bech32String {
    req.msg = encodeBase64(Uint8Array.wrap(String.UTF8.encode(req.msg)))
    const requestStr = JSON.stringify<CreateAccountRequest>(req);
    LoggerDebug(`${moduleName}:wasmx_env`, "createAccount", ["request", requestStr])
    const responsebz = wasmx.createAccount(String.UTF8.encode(requestStr));
    const resp = JSON.parse<CreateAccountResponse>(String.UTF8.decode(responsebz));
    return resp.address
}

export function create2Account(req: Create2AccountRequest, moduleName: string = ""): Bech32String {
    req.msg = encodeBase64(Uint8Array.wrap(String.UTF8.encode(req.msg)))
    const requestStr = JSON.stringify<Create2AccountRequest>(req);
    LoggerDebug(`${moduleName}:wasmx_env`, "create2Account", ["request", requestStr])
    const responsebz = wasmx.create2Account(String.UTF8.encode(requestStr));
    const resp = JSON.parse<Create2AccountResponse>(String.UTF8.decode(responsebz));
    return resp.address
}

// base64 encoded data
export function sha256(base64Data: string): string {
    const buf = decodeBase64(base64Data);
    const res = wasmx.sha256(buf.buffer);
    return encodeBase64(Uint8Array.wrap(res));
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
    return ed25519SignBytes(privKeyStr, msgBase64.buffer)
}

export function ed25519SignBytes(privKeyStr: string, msg: ArrayBuffer): Base64String {
    const privKey = decodeBase64(privKeyStr);
    const signature = wasmx.ed25519Sign(privKey.buffer, msg);
    const signatureBase64 = encodeBase64(Uint8Array.wrap(signature));
    LoggerDebugWrap("ed25519Sign", ["signature", signatureBase64])
    return signatureBase64
}

export function ed25519Verify(pubKeyStr: Base64String, signatureStr: Base64String, msg: string): boolean {
    return ed25519VerifyBytes(pubKeyStr, signatureStr, String.UTF8.encode(msg));
}

export function ed25519VerifyBytes(pubKeyStr: Base64String, signatureStr: Base64String, msg: ArrayBuffer): boolean {
    const pubKey = decodeBase64(pubKeyStr);
    const signature = decodeBase64(signatureStr);
    LoggerDebugWrap("ed25519Verify", ["signature", signatureStr, "pubKey", pubKeyStr])
    const resp = wasmx.ed25519Verify(pubKey.buffer, signature.buffer, msg);
    if (resp == 1) return true;
    return false;
}

export function addr_humanize(value: ArrayBuffer): string {
    const addr = wasmx.addr_humanize(value);
    return String.UTF8.decode(addr);
}

export function addr_canonicalize(value: string): ArrayBuffer {
    return wasmx.addr_canonicalize(String.UTF8.encode(value));
}

export function addr_humanize_mc(bz: ArrayBuffer, prefix: string): string {
    const addr = wasmx.addr_humanize_mc(bz, String.UTF8.encode(prefix));
    return String.UTF8.decode(addr);
}

export function addr_canonicalize_mc(value: Bech32String): PrefixedAddress {
    const resp = wasmx.addr_canonicalize_mc(String.UTF8.encode(value));
    const res = JSON.parse<PrefixedAddress>(String.UTF8.decode(resp));
    return res;
}

export function addr_equivalent(addr1: Bech32String, addr2: Bech32String): boolean {
    const resp = wasmx.addr_equivalent(String.UTF8.encode(addr1), String.UTF8.encode(addr2));
    return resp == 1;
}

export function getChainId(): string {
    const resp = wasmx.getChainId()
    return String.UTF8.decode(resp)
}

export function getCaller(): Bech32String {
    return addr_humanize(wasmx.getCaller())
}

export function getAddress(): Bech32String {
    return addr_humanize(wasmx.getAddress())
}

export function getAddressByRole(value: string): Bech32String {
    const addr = wasmx.getAddressByRole(String.UTF8.encode(value))
    return addr_humanize(addr);
}

export function getRoleByAddress(value: Bech32String): string {
    const addr = addr_canonicalize(value)
    const role = wasmx.getRoleByAddress(addr)
    return String.UTF8.decode(role)
}

export function executeCosmosMsg(msg: string, moduleName: string = ""): CallResponse {
    LoggerDebug(`${moduleName}:wasmx_env`, "executeCosmosMsg", ["msg", msg])
    const responsebz = wasmx.executeCosmosMsg(String.UTF8.encode(msg));
    LoggerDebug(`${moduleName}:wasmx_env`, "executeCosmosMsg", ["response", String.UTF8.decode(responsebz)])
    return JSON.parse<CallResponse>(String.UTF8.decode(responsebz));
}

export function decodeCosmosTxToJson(data: ArrayBuffer): SignedTransaction {
    const result = wasmx.decodeCosmosTxToJson(data)
    // encoded JSON object
    let resultstr = String.UTF8.decode(result)
    return JSON.parse<SignedTransaction>(resultstr);
}

export function verifyCosmosTx(encodedTx: Base64String): VerifyCosmosTxResponse {
    const data = decodeBase64(encodedTx).buffer;
    const result = wasmx.verifyCosmosTx(data)
    return JSON.parse<VerifyCosmosTxResponse>(String.UTF8.decode(result));
}

export function getCurrentBlock(): BlockInfo {
    const data = wasmx.getCurrentBlock();
    return JSON.parse<BlockInfo>(String.UTF8.decode(data));
}

// TODO replace this with sha256.Sum256(bz)[:20]
export function ed25519PubToHex(pubKey: Base64String): HexString {
    const data = decodeBase64(pubKey).buffer;
    const bz = wasmx.ed25519PubToHex(data);
    const hexstr = uint8ArrayToHex(Uint8Array.wrap(bz));
    return toUpperCase(hexstr);
}

export function startTimeout(contract: string, delayms: i64, args: string): void {
    const req = new StartTimeoutRequest(contract, delayms, encodeBase64(Uint8Array.wrap(String.UTF8.encode(args))));
    wasmx.startTimeout(String.UTF8.encode(JSON.stringify<StartTimeoutRequest>(req)));
}

export function startBackgroundProcess(contract: string, args: string): void {
    const encodedargs = encodeBase64(Uint8Array.wrap(String.UTF8.encode(args)));
    const msg = `{"data":"${encodedargs}"}`
    const encodedmsg = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msg)));
    const req = new StartBackgroundProcessRequest(contract, encodedmsg);
    wasmx.startBackgroundProcess(String.UTF8.encode(JSON.stringify<StartBackgroundProcessRequest>(req)));
}

export function writeToBackgroundProcess(contract: string, ptrFunc: string, data: Base64String): WriteToBackgroundProcessResponse {
    const req = new WriteToBackgroundProcessRequest(contract, data, ptrFunc);
    const resp = wasmx.writeToBackgroundProcess(String.UTF8.encode(JSON.stringify<WriteToBackgroundProcessRequest>(req)));
    return JSON.parse<WriteToBackgroundProcessResponse>(String.UTF8.decode(resp));
}

export function readFromBackgroundProcess(contract: string, ptrFunc: string, lenFunc: string): ReadFromBackgroundProcessResponse {
    const req = new ReadFromBackgroundProcessRequest(contract, ptrFunc, lenFunc);
    const resp = wasmx.readFromBackgroundProcess(String.UTF8.encode(JSON.stringify<ReadFromBackgroundProcessRequest>(req)));
    return JSON.parse<ReadFromBackgroundProcessResponse>(String.UTF8.decode(resp));
}
