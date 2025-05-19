import { Bech32String, RoleChangedActionType } from "wasmx-env/assembly/types";
import { RolesChangedHook } from "./types";

export function shouldActivate(data: RolesChangedHook, addr: Bech32String): boolean {
    if (data.role != null) {
        return true;
    };
    const roleChanged = data.role_changed;
    if (roleChanged == null) {
        return false;
    }
    if (roleChanged.action_type == RoleChangedActionType.Add) {
        return true;
    }
    if (roleChanged.action_type == RoleChangedActionType.Replace && roleChanged.contract_address == addr) {
        return true;
    }
    return false;
}
