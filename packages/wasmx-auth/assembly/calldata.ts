import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { AddressBytesToStringRequest, AddressStringToBytesRequest, Bech32PrefixRequest, MsgInitGenesis, MsgUpdateParams, QueryAccountAddressByIDRequest, QueryAccountInfoRequest, QueryAccountRequest, QueryAccountsRequest, QueryModuleAccountByNameRequest, QueryModuleAccountsRequest, QueryParamsRequest } from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: MsgInitGenesis | null = null;

    // tx
    UpdateParams: MsgUpdateParams | null = null;

    // query
    Accounts: QueryAccountsRequest | null = null;
    Account: QueryAccountRequest | null = null;
    AccountAddressByID: QueryAccountAddressByIDRequest | null = null;
    Params: QueryParamsRequest | null = null;
    ModuleAccounts: QueryModuleAccountsRequest | null = null;
    ModuleAccountByName: QueryModuleAccountByNameRequest | null = null;
    Bech32Prefix: Bech32PrefixRequest | null = null;
    AddressBytesToString: AddressBytesToStringRequest | null = null;
    AddressStringToBytes: AddressStringToBytesRequest | null = null;
    AccountInfo: QueryAccountInfoRequest | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
