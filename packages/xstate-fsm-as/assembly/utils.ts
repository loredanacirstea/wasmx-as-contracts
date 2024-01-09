import { Base64String, HexString } from 'wasmx-env/assembly/types';
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import { uint8ArrayToHex, hexToUint8Array } from 'wasmx-utils/assembly/utils';

export function base64ToHex(value: Base64String): HexString {
    return uint8ArrayToHex(decodeBase64(value))
}

export function hex64ToBase64(value: HexString): Base64String {
    return encodeBase64(hexToUint8Array(value))
}

