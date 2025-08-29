import { JSON } from "json-as";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxcore from './wasmxcore';
import {
    GrpcResponse,
    StartBackgroundProcessRequest,
    StartBackgroundProcessResponse,
    WriteToBackgroundProcessRequest,
    WriteToBackgroundProcessResponse,
    ReadFromBackgroundProcessRequest,
    ReadFromBackgroundProcessResponse,
    StartTimeoutRequest,
    CancelTimeoutRequest,
    MigrateContractStateByStorageRequest,
    GlobalStorageLoadRequest,
    GlobalStorageStoreRequest,
    GlobalStorageResetRequest,
    GlobalStorageResetResponse,
    MigrateContractStateByAddressRequest,
    UpdateSystemCacheRequest,
    UpdateSystemCacheResponse,
} from './types';
import { LoggerDebugExtended, LoggerInfo } from "./utils";
import { Base64String, Bech32String, ContractInfo } from "wasmx-env/assembly/types";
import { addr_canonicalize } from "wasmx-env/assembly/wasmx_wrap";

export function grpcRequest(ip: string, contract: Uint8Array, data: string): GrpcResponse {
    const contractAddress = encodeBase64(contract);
    const reqstr = `{"ip_address":"${ip}","contract":"${contractAddress}","data":"${data}"}`
    LoggerDebugExtended("grpc request: ", ["request", reqstr]);
    const req = String.UTF8.encode(reqstr);
    const result = wasmxcore.grpcRequest(req);
    LoggerDebugExtended("grpc request: ", ["response",  String.UTF8.decode(result)]);
    const response = JSON.parse<GrpcResponse>(String.UTF8.decode(result));
    if (response.error.length == 0) {
        response.data = String.UTF8.decode(decodeBase64(response.data).buffer);
    }
    console.debug("grpc response data: " + response.data);
    return response;
}

export function startTimeout(id: string, contract: string, delayms: i64, args: string): void {
    const req = new StartTimeoutRequest(id, contract, delayms, encodeBase64(Uint8Array.wrap(String.UTF8.encode(args))));
    wasmxcore.startTimeout(String.UTF8.encode(JSON.stringify<StartTimeoutRequest>(req)));
}

export function cancelTimeout(id: string): void {
    const req = new CancelTimeoutRequest(id);
    wasmxcore.cancelTimeout(String.UTF8.encode(JSON.stringify<CancelTimeoutRequest>(req)));
}

export function startBackgroundProcess(contract: string, args: string): void {
    const encodedargs = encodeBase64(Uint8Array.wrap(String.UTF8.encode(args)));
    const msg = `{"data":"${encodedargs}"}`
    const encodedmsg = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msg)));
    const req = new StartBackgroundProcessRequest(contract, encodedmsg);
    wasmxcore.startBackgroundProcess(String.UTF8.encode(JSON.stringify<StartBackgroundProcessRequest>(req)));
}

export function writeToBackgroundProcess(contract: string, ptrFunc: string, data: Base64String): WriteToBackgroundProcessResponse {
    const req = new WriteToBackgroundProcessRequest(contract, data, ptrFunc);
    const resp = wasmxcore.writeToBackgroundProcess(String.UTF8.encode(JSON.stringify<WriteToBackgroundProcessRequest>(req)));
    return JSON.parse<WriteToBackgroundProcessResponse>(String.UTF8.decode(resp));
}

export function readFromBackgroundProcess(contract: string, ptrFunc: string, lenFunc: string): ReadFromBackgroundProcessResponse {
    const req = new ReadFromBackgroundProcessRequest(contract, ptrFunc, lenFunc);
    const resp = wasmxcore.readFromBackgroundProcess(String.UTF8.encode(JSON.stringify<ReadFromBackgroundProcessRequest>(req)));
    return JSON.parse<ReadFromBackgroundProcessResponse>(String.UTF8.decode(resp));
}

export function migrateContractStateByStorageType(req: MigrateContractStateByStorageRequest): void {
    const data = String.UTF8.encode(JSON.stringify<MigrateContractStateByStorageRequest>(req))
    return wasmxcore.migrateContractStateByStorageType(data);
}

export function migrateContractStateByAddress(req: MigrateContractStateByAddressRequest): void {
    const data = String.UTF8.encode(JSON.stringify<MigrateContractStateByAddressRequest>(req))
    return wasmxcore.migrateContractStateByAddress(data);
}

export function storageLoadGlobal(req: GlobalStorageLoadRequest): ArrayBuffer {
    const databuf = String.UTF8.encode(JSON.stringify<GlobalStorageLoadRequest>(req))
    return wasmxcore.storageLoadGlobal(databuf)
}

export function storageStoreGlobal(req: GlobalStorageStoreRequest): void {
    const databuf = String.UTF8.encode(JSON.stringify<GlobalStorageStoreRequest>(req))
    wasmxcore.storageStoreGlobal(databuf)
}

export function storageDeleteGlobal(req: GlobalStorageLoadRequest): void {
    const databuf = String.UTF8.encode(JSON.stringify<GlobalStorageLoadRequest>(req))
    return wasmxcore.storageDeleteGlobal(databuf)
}

export function storageHasGlobal(req: GlobalStorageLoadRequest): i32 {
    const databuf = String.UTF8.encode(JSON.stringify<GlobalStorageLoadRequest>(req))
    return wasmxcore.storageHasGlobal(databuf)
}

export function storageResetGlobal(req: GlobalStorageResetRequest): GlobalStorageResetResponse {
    const databuf = String.UTF8.encode(JSON.stringify<GlobalStorageResetRequest>(req))
    const resp = wasmxcore.storageResetGlobal(databuf)
    return JSON.parse<GlobalStorageResetResponse>(String.UTF8.decode(resp))
}

export function updateSystemCache(req: UpdateSystemCacheRequest): UpdateSystemCacheResponse {
    const datastr = JSON.stringify<UpdateSystemCacheRequest>(req)
    const data = String.UTF8.encode(datastr)
    LoggerInfo("update system cache: ", ["data", datastr]);
    const resp = wasmxcore.updateSystemCache(data);
    const respstr = String.UTF8.decode(resp)
    LoggerInfo("update system cache: ", ["data", datastr, "host_response", respstr]);
    return JSON.parse<UpdateSystemCacheResponse>(respstr)
}
