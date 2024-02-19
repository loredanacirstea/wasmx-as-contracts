import { JSON } from "json-as/assembly";
import { AddressBytesToStringRequest, AddressStringToBytesRequest, Bech32PrefixRequest, MsgInitGenesis, MsgSetAccount, MsgUpdateParams, QueryAccountAddressByIDRequest, QueryAccountInfoRequest, QueryAccountRequest, QueryAccountResponse, QueryAccountsRequest, QueryModuleAccountByNameRequest, QueryModuleAccountsRequest, QueryParamsRequest, StoredAccount } from "./types";
import { addNewAccount, getAccountAddrById, getAccountByAddr } from "./storage";

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function SetAccount(req: MsgSetAccount): ArrayBuffer {
    addNewAccount(new StoredAccount(req.address, req.pub_key, 0, req.sequence));
    return new ArrayBuffer(0)
}

export function UpdateParams(req: MsgUpdateParams): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetAccounts(req: QueryAccountsRequest): ArrayBuffer {
    // data = data.replaceAll(`"anytype"`, `"@type"`)
    return new ArrayBuffer(0)
}

export function GetAccount(req: QueryAccountRequest): ArrayBuffer {
    const acc = getAccountByAddr(req.address);
    let response = `{"account":null}`
    if (acc != null) {
        response = JSON.stringify<QueryAccountResponse>(new QueryAccountResponse(acc))
        response = response.replaceAll(`"anytype"`, `"@type"`)
    }
    return String.UTF8.encode(response)
}

export function GetAccountAddressByID(req: QueryAccountAddressByIDRequest): ArrayBuffer {
    let response = `{"account":null}`
    const addr = getAccountAddrById(req.account_id)
    if (addr != null) {
        const acc = getAccountByAddr(addr);
        if (acc != null) {
            response = JSON.stringify<QueryAccountResponse>(new QueryAccountResponse(acc))
            response = response.replaceAll(`"anytype"`, `"@type"`)
        }
    }
    return String.UTF8.encode(response)
}

export function GetParams(req: QueryParamsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
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
