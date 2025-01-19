import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import { DEFAULT_GAS_TX } from "./const";
import * as wasmx from "./wasmx";
import * as wasmxw from "./wasmx_wrap";
import * as roles from "./roles";
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

export function queryRoleContract(calldata: string, moduleName: string): CallResponse {
    return callContract(roles.ROLE_ROLES, calldata, true, moduleName)
}

export function getRoleName(moduleName: string, addr: Bech32String): string {
    const calldata = `{"GetRoleNameByAddress":{"address":"${addr}"}}`
    const resp = callContract(roles.ROLE_ROLES, calldata, true, moduleName)
    if (resp.success > 0) {
        const msg = `role name by address failed: ${resp.data}`
        wasmxw.LoggerDebug(moduleName, "revert", ["err", msg, "module", moduleName])
        wasmx.revert(String.UTF8.encode(msg));
        throw new Error(msg);
    }
    return resp.data;
}

export function callerHasRole(moduleName: string): bool {
    const caller = wasmxw.getCaller()
    const role = getRoleName(moduleName, caller)
    if (role.length > 0) return true;
    return false;
}

// used to restrict EOA callers
export function onlyInternal(moduleName: string, message: string): void {
    const caller = wasmxw.getCaller()
    const role = getRoleName(moduleName, caller)

    if (role.length == 0) {
        const msg = `unauthorized caller: ${caller}: ${message}`
        wasmxw.LoggerDebug(moduleName, "revert", ["err", msg, "module", moduleName])
        wasmx.revert(String.UTF8.encode(msg));
        throw new Error(msg);
    }
}
