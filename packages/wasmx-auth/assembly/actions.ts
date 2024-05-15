import { JSON } from "json-as/assembly";
import { AddressBytesToStringRequest, AddressStringToBytesRequest, BaseAccount, Bech32PrefixRequest, MsgInitGenesis, MsgNewBaseAccount, MsgNewModuleccount, MsgSetAccount, MsgUpdateParams, QueryAccountAddressByIDRequest, QueryAccountInfoRequest, QueryAccountRequest, QueryAccountResponse, QueryAccountsRequest, QueryHasAccountResponse, QueryModuleAccountByNameRequest, QueryModuleAccountsRequest, QueryParamsRequest, QueryParamsResponse, NewBaseAccount } from "./types";
import { getAccountAddrById, getAccountByAddr, getParams, getTypeUrlBase, getTypeUrlModule, setAccount, setParams, setTypeUrlBase, setTypeUrlModule } from "./storage";

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    for (let i = 0; i < req.accounts.length; i++) {
        setAccount(req.accounts[i])
    }
    setParams(req.params)
    setTypeUrlBase(req.base_account_typeurl)
    setTypeUrlModule(req.module_account_typeurl)
    return new ArrayBuffer(0)
}

export function SetNewBaseAccount(req: MsgNewBaseAccount): ArrayBuffer {
    const typeurl = getTypeUrlBase();
    const account = NewBaseAccount(typeurl, req.address)
    setAccount(account);
    return new ArrayBuffer(0)
}

export function SetNewModuleAccount(req: MsgNewModuleccount): ArrayBuffer {
    const typeurl = getTypeUrlModule();
    const account = NewBaseAccount(typeurl, req.address)
    setAccount(account);
    return new ArrayBuffer(0)
}

export function SetAccount(req: MsgSetAccount): ArrayBuffer {
    setAccount(req.account)
    return new ArrayBuffer(0)
}

export function UpdateParams(req: MsgUpdateParams): ArrayBuffer {
    // TODO authority
    return new ArrayBuffer(0)
}

export function GetAccounts(req: QueryAccountsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetAccount(req: QueryAccountRequest): ArrayBuffer {
    const acc = getAccountByAddr(req.address);
    let response = `{"account":null}`
    if (acc != null) {
        response = JSON.stringify<QueryAccountResponse>(new QueryAccountResponse(acc))
    }
    return String.UTF8.encode(response)
}

export function HasAccount(req: QueryAccountRequest): ArrayBuffer {
    const acc = getAccountByAddr(req.address);
    const response = JSON.stringify<QueryHasAccountResponse>(new QueryHasAccountResponse(acc != null))
    return String.UTF8.encode(response)
}

export function GetAccountAddressByID(req: QueryAccountAddressByIDRequest): ArrayBuffer {
    let response = `{"account":null}`
    const addr = getAccountAddrById(req.account_id)
    if (addr != null) {
        const acc = getAccountByAddr(addr);
        if (acc != null) {
            response = JSON.stringify<QueryAccountResponse>(new QueryAccountResponse(acc))
        }
    }
    return String.UTF8.encode(response)
}

export function GetParams(req: QueryParamsRequest): ArrayBuffer {
    const resp = new QueryParamsResponse(getParams())
    return String.UTF8.encode(JSON.stringify<QueryParamsResponse>(resp))
}

export function GetModuleAccounts(req: QueryModuleAccountsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetModuleAccountByName(req: QueryModuleAccountByNameRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetBech32Prefix(req: Bech32PrefixRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetAddressBytesToString(req: AddressBytesToStringRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetAddressStringToBytes(req: AddressStringToBytesRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetAccountInfo(req: QueryAccountInfoRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}
