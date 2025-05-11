import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { AddressBytesToStringRequest, AddressStringToBytesRequest, Bech32PrefixRequest, GenesisState, MsgNewBaseAccount, MsgNewModuleccount, MsgSetAccount, MsgUpdateParams, QueryAccountAddressByIDRequest, QueryAccountInfoRequest, QueryAccountRequest, QueryAccountsRequest, QueryModuleAccountByNameRequest, QueryModuleAccountsRequest, QueryParamsRequest } from './types';

@json
export class CallData {
    InitGenesis: GenesisState | null = null;

    // tx
    UpdateParams: MsgUpdateParams | null = null;
    SetAccount: MsgSetAccount | null = null;
    SetNewBaseAccount: MsgNewBaseAccount | null = null;
    SetNewModuleAccount: MsgNewModuleccount | null = null;

    // query
    GetAccounts: QueryAccountsRequest | null = null;
    GetAccount: QueryAccountRequest | null = null;
    HasAccount:  QueryAccountRequest | null = null;
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
    return JSON.parse<CallData>(calldstr);
}
