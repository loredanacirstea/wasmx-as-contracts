import { JSON } from "json-as/assembly";
import * as wasmxw from "./wasmx_wrap";
import { Bech32String } from "./types";

export function checkAuthorization(caller: Bech32String, authorities: Bech32String[]): boolean {
    let authorized = authorities.includes(caller);
    if (authorized) return true;
    for (let i = 0; i < authorities.length; i++) {
        const addr = wasmxw.getAddressByRole(authorities[i])
        if (addr == caller) return true;
    }
    return false;
}
