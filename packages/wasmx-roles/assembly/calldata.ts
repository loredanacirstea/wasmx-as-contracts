import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { GetAddressOrRoleRequest, GetRoleByLabelRequest, GetRoleLabelByContractRequest, RegisterRoleRequest } from './types';

// @ts-ignore
@serializable
export class CallData {
    // tx
    RegisterRole: RegisterRoleRequest | null = null;

    // query
    GetAddressOrRole: GetAddressOrRoleRequest | null = null;
    GetRoleLabelByContract: GetRoleLabelByContractRequest | null = null;
    GetRoleByLabel: GetRoleByLabelRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
