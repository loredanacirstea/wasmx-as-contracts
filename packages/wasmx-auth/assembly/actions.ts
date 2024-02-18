import { JSON } from "json-as/assembly";
import { AddressBytesToStringRequest, AddressStringToBytesRequest, Bech32PrefixRequest, MsgInitGenesis, MsgUpdateParams, QueryAccountAddressByIDRequest, QueryAccountInfoRequest, QueryAccountRequest, QueryAccountsRequest, QueryModuleAccountByNameRequest, QueryModuleAccountsRequest, QueryParamsRequest } from "./types";

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function UpdateParams(req: MsgUpdateParams): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function Accounts(req: QueryAccountsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function Account(req: QueryAccountRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function AccountAddressByID(req: QueryAccountAddressByIDRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function Params(req: QueryParamsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function ModuleAccounts(req: QueryModuleAccountsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function ModuleAccountByName(req: QueryModuleAccountByNameRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function Bech32Prefix(req: Bech32PrefixRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function AddressBytesToString(req: AddressBytesToStringRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function AddressStringToBytes(req: AddressStringToBytesRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function AccountInfo(req: QueryAccountInfoRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}
