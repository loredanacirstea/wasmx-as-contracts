import { JSON } from "json-as/assembly";
import * as wasmxw from "./wasmx_wrap";
import { Bech32String } from "./types";

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
