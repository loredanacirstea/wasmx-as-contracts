import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { MissedBlockBitmapChunkSize, Params, ValidatorSigningInfo} from "./types";
import { ConsensusAddressString } from "wasmx-env/assembly/types";
import { base64ToString, bytes, concatBytes, stringToBytes, u64ToUint8ArrayBE } from "wasmx-utils/assembly/utils";

export const paramPrefix: u8 = 1
export const signingInfoPrefix: u8 = 2
export const missedBlocksBitmapPrefix: u8 = 3

export const KeyParam = bytes([paramPrefix]);
// address => ValidatorSigningInfo
export const KeySigningInfo = bytes([signingInfoPrefix]);
// address, chunkIndex => bitmap chunk
export const KeyMissedBlocksBitmap = bytes([missedBlocksBitmapPrefix]);

export function getParamKey(): Uint8Array {
    return KeyParam
}

export function getValidatorSigningInfoKey(addr: ConsensusAddressString): Uint8Array {
    return concatBytes(KeySigningInfo, stringToBytes(addr));
}

export function getMissedBlockBitmapPrefixKey(addr: ConsensusAddressString): Uint8Array {
    return concatBytes(KeyMissedBlocksBitmap, stringToBytes(addr));
}

export function getMissedBlockBitmapKey(addr: ConsensusAddressString, chunkIndex: i64): Uint8Array {
    const bz = u64ToUint8ArrayBE(chunkIndex);
    return concatBytes(getMissedBlockBitmapPrefixKey(addr), bz);
}

export function getMissedBlockBitmapChunk(addr: ConsensusAddressString, chunkIndex: i64): Uint8Array {
    const key = getMissedBlockBitmapKey(addr, chunkIndex)
    let value = wasmx.storageLoad(key.buffer)
    if (value.byteLength == 0) {
        value = new ArrayBuffer(MissedBlockBitmapChunkSize)
        const uint8Array = Uint8Array.wrap(value);
        uint8Array.fill(0);
    }
    return Uint8Array.wrap(value);
}

export function setMissedBlockBitmapChunk (addr: ConsensusAddressString, chunkIndex: i64, value: Uint8Array): void {
    const key = getMissedBlockBitmapKey(addr, chunkIndex)
    wasmx.storageStore(key.buffer, value.buffer);
}

export function deleteMissedBlockBitmap(addr: ConsensusAddressString): void {
    const key = getMissedBlockBitmapPrefixKey(addr)
    wasmxw.sdeleteRange(base64.encode(key), "");
}

export function getValidatorSigningInfos(): ValidatorSigningInfo[] {
    const startKey = getValidatorSigningInfoKey("");
    const values = wasmxw.sloadRange(base64.encode(startKey), "", false);
    const msgs: ValidatorSigningInfo[] = [];
    for (let i = 0; i < values.length; i++) {
        const msgstr = base64ToString(values[i])
        const msg = JSON.parse<ValidatorSigningInfo>(msgstr)
        msgs.push(msg);
    }
    return msgs
}


export function getValidatorSigningInfo(addr: ConsensusAddressString): ValidatorSigningInfo | null {
    const value = wasmx.storageLoad(getValidatorSigningInfoKey(addr).buffer);
    if (value.byteLength == 0) return null;
    return JSON.parse<ValidatorSigningInfo>(String.UTF8.decode(value));
}

export function setValidatorSigningInfo(addr: ConsensusAddressString, signingInfo: ValidatorSigningInfo): void {
    const key = getValidatorSigningInfoKey(addr)
    const data = JSON.stringify<ValidatorSigningInfo>(signingInfo)
    wasmx.storageStore(key.buffer, String.UTF8.encode(data));
}

export function getParams(): Params {
    const value = getParamsInternal()
    return JSON.parse<Params>(value);
}

export function getParamsInternal(): string {
    const value = wasmx.storageLoad(getParamKey().buffer);
    return String.UTF8.decode(value);
}

export function setParams(params: Params): void {
    return wasmx.storageStore(getParamKey().buffer, String.UTF8.encode(JSON.stringify<Params>(params)));
}
