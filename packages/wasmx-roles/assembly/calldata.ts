import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { GetAddressOrRoleRequest, GetRoleByLabelRequest, GetRoleLabelByContractRequest, GetRolesRequest, SetRoleRequest, MsgRunHook, GetRoleByRoleNameRequest, GetRoleNameByAddressRequest } from './types';
import { MsgSetup, RoleChanged } from "wasmx-env/assembly/types";

// @ts-ignore
@serializable
export class EmptyRequest {}

// @ts-ignore
@serializable
export class CallData {
    // system
    setup: MsgSetup | null = null;

    // hooks
    EndBlock: MsgRunHook | null = null;

    // tx
    SetRole: SetRoleRequest | null = null;
    SetContractForRole: RoleChanged | null = null;

    // query
    GetRoleNameByAddress: GetRoleNameByAddressRequest | null = null;
    GetRoleByRoleName: GetRoleByRoleNameRequest | null = null;
    GetAddressOrRole: GetAddressOrRoleRequest | null = null;
    GetRoleLabelByContract: GetRoleLabelByContractRequest | null = null;
    GetRoleByLabel: GetRoleByLabelRequest | null = null;
    GetRoles: GetRolesRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
