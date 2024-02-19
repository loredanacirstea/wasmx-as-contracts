import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { AddressBytesToStringRequest, AddressStringToBytesRequest, Bech32PrefixRequest, MsgInitGenesis, MsgSetAccount, MsgUpdateParams, QueryAccountAddressByIDRequest, QueryAccountInfoRequest, QueryAccountRequest, QueryAccountsRequest, QueryModuleAccountByNameRequest, QueryModuleAccountsRequest, QueryParamsRequest } from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: MsgInitGenesis | null = null;

    // tx
    UpdateParams: MsgUpdateParams | null = null;
    SetAccount: MsgSetAccount | null = null;

    // query
    GetAccounts: QueryAccountsRequest | null = null;
    GetAccount: QueryAccountRequest | null = null;
    GetAccountAddressByID: QueryAccountAddressByIDRequest | null = null;
    GetParams: QueryParamsRequest | null = null;
    GetModuleAccounts: QueryModuleAccountsRequest | null = null;
    GetModuleAccountByName: QueryModuleAccountByNameRequest | null = null;
    GetBech32Prefix: Bech32PrefixRequest | null = null;
    GetAddressBytesToString: AddressBytesToStringRequest | null = null;
    GetAddressStringToBytes: AddressStringToBytesRequest | null = null;
    GetAccountInfo: QueryAccountInfoRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    calldstr = calldstr.replaceAll(`"@type"`, `"anytype"`)
    return JSON.parse<CallData>(calldstr);
}
