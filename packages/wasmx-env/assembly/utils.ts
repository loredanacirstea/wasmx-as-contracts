import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import { DEFAULT_GAS_TX } from "./const";
import * as wasmxw from "./wasmx_wrap";
import { Bech32String, CallRequest, CallResponse } from "./types";
import { BigInt } from "./bn";

export function isAuthorized(caller: Bech32String, authorities: Bech32String[]): boolean {
    let authorized = authorities.includes(caller);
    if (authorized) return true;
    for (let i = 0; i < authorities.length; i++) {
        const addr = wasmxw.getAddressByRole(authorities[i])
        if (addr == caller) return true;
    }
    return false;
}

export function toUpperCase(str: string): string {
    let result: string = "";
    for (let i: i32 = 0; i < str.length; i++) {
        let charCode: i32 = str.charCodeAt(i);
        // Convert lowercase ASCII letters to uppercase
        if (charCode >= 97 && charCode <= 122) { // 'a' to 'z'
            charCode -= 32;
        }
        result += String.fromCharCode(charCode);
    }
    return result;
}

export function callContract(addr: Bech32String, calldata: string, isQuery: boolean, moduleName: string): CallResponse {
    const req = new CallRequest(addr, calldata, BigInt.zero(), DEFAULT_GAS_TX, isQuery);
    const resp = wasmxw.call(req, moduleName);
    // result or error
    resp.data = String.UTF8.decode(base64.decode(resp.data).buffer);
    return resp;
}
