import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import { Base64String, CodeInfo, ContractInfo } from "wasmx-env/assembly/types";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { u64ToUint8ArrayBE, bytes, concatBytes, stringToBytes, u64FromBuffer, base64ToHex } from "wasmx-utils/assembly/utils";

export const codePrefix: u8 = 1
export const codeHashPrefix: u8 = 2
export const contractPrefix: u8 = 3
export const contractStorePrefix: u8 = 4
export const sequencePrefix: u8 = 5
export const prefixSystemContract: u8 = 6

export const KeyCodePrefix = bytes([codePrefix]);
export const KeyCodeHashPrefix = bytes([codeHashPrefix]);
export const KeyContractPrefix = bytes([contractPrefix]);
export const KeyContractStorePrefix = bytes([contractStorePrefix]);
export const KeyLastCodeID = concatBytes(bytes([sequencePrefix]), stringToBytes("lastCodeId"));

// GetCodeKey constructs the key for retreiving the ID for the WASM code
export function getLastCodeIDKey(): Uint8Array {
    return KeyLastCodeID
}

// GetCodeRootKey constructs the key for retreiving the ID for the WASM code
export function getCodeRootKey(): Uint8Array {
    return KeyCodePrefix
}

export function getCodeHashPrefix(): Uint8Array {
    return KeyCodeHashPrefix
}

// GetCodeKey constructs the key for retreiving the ID for the WASM code
export function getCodeKey(codeID: u64): Uint8Array {
    const contractIDBz = u64ToUint8ArrayBE(codeID)
    return concatBytes(getCodeRootKey(), contractIDBz);
}

export function getCodeHashKey(codeHash: Base64String): Uint8Array {
    return concatBytes(getCodeHashPrefix(), base64.decode(codeHash));
}

// GetContractAddressRootKey returns the key for the WASM contract instance
export function getContractAddressRootKey(): Uint8Array {
    return KeyContractPrefix;
}

// GetContractAddressKey returns the key for the WASM contract instance
export function getContractAddressKey(addr: Base64String): Uint8Array {
    return concatBytes(getContractAddressRootKey(), base64.decode(addr));
}

// GetContractStorePrefix returns the store prefix for the WASM contract instance
export function getContractStorePrefix(addr: Uint8Array): Uint8Array {
    return concatBytes(KeyContractStorePrefix, addr);
}

// Auto-increment ID using the storage
export function autoIncrementID(): u64 {
    const key = getLastCodeIDKey();
    const id = getLastCodeId() + 1;
    const newBz = u64ToUint8ArrayBE(id);
    wasmx.storageStore(key.buffer, newBz.buffer);
    return id;
}

export function getLastCodeId(): u64 {
    const key = getLastCodeIDKey();
    const bz = wasmx.storageLoad(key.buffer);
    let id: u64 = 0;
    if (bz.byteLength > 0) {
        id = u64FromBuffer(bz);
    }
    return id;
}

// Get contract info by address
export function getContractInfo(addr: Base64String): ContractInfo | null {
    const key = getContractAddressKey(addr);
    const value = wasmx.storageLoad(key.buffer);
    if (value.byteLength == 0) return null;
    return JSON.parse<ContractInfo>(String.UTF8.decode(value));
}

// Check if a contract info exists
export function hasContractInfo(addr: Base64String): bool {
    const key = getContractAddressKey(addr);
    return wasmx.storageLoad(key.buffer).byteLength > 0;
}

// Store contract info in the storage
export function storeContractInfo(addr: Base64String, contractInfo: ContractInfo): void {
    const key = getContractAddressKey(addr);
    wasmx.storageStore(key.buffer, String.UTF8.encode(JSON.stringify<ContractInfo>(contractInfo)));
}

// // Import contract state
// export function importContractState(contractAddress: Uint8Array, models: Array<{ key: Uint8Array, value: Uint8Array }>): void {
//     const prefixStoreKey = getContractStorePrefix(contractAddress);
//     for (let i = 0; i < models.length; i++) {
//         const model = models[i];
//         if (wasmx.storageLoad(model.key).byteLength > 0) {
//             throw new Error(`Duplicate key: ${model.key.toString()}`);
//         }
//         wasmx.storageStore(model.key, model.value);
//     }
// }

// Retrieve codeId by code hash
export function getCodeId(codeHash: Base64String): u64 {
    const key = getCodeHashKey(codeHash);
    const bz = wasmx.storageLoad(key.buffer);
    let id: u64 = 0;
    if (bz.byteLength > 0) {
        id = u64FromBuffer(bz);
    }
    return id;
}

export function setCodeId(codeHash: Base64String, codeId: u64): void {
    const key = getCodeHashKey(codeHash);
    const newBz = u64ToUint8ArrayBE(codeId);
    wasmx.storageStore(key.buffer, newBz.buffer);
}


// Retrieve code info by ID
export function getCodeInfo(codeID: u64): CodeInfo | null {
    const key = getCodeKey(codeID);
    const value = wasmx.storageLoad(key.buffer);
    if (value.byteLength == 0) return null;
    return JSON.parse<CodeInfo>(String.UTF8.decode(value));
}

export function storeCodeInfo(codeID: u64, data: CodeInfo): void {
    const key = getCodeKey(codeID);
    const datastr = JSON.stringify<CodeInfo>(data)
    wasmx.storageStore(key.buffer, String.UTF8.encode(datastr));
    setCodeId(data.code_hash, codeID);
}

// Check if code info exists
export function containsCodeInfo(codeID: u64): bool {
    const key = getCodeKey(codeID);
    return wasmx.storageLoad(key.buffer).byteLength > 0;
}
