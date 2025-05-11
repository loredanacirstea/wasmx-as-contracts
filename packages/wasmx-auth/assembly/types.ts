import { JSON } from "json-as";
import { Base64String, Bech32String, PublicKey } from 'wasmx-env/assembly/types';
import { AnyWrap } from "wasmx-env/assembly/wasmx_types";

export const MODULE_NAME = "auth"
export const ModuleAccountTypeName = "ModuleAccount"
export const BaseAccountTypeName = "BaseAccount"
export const TypeUrl_BaseAccount = "/mythos.cosmosmod.v1.BaseAccount"
export const TypeUrl_ModuleAccount = "/mythos.cosmosmod.v1.ModuleAccount"

@json
export class GenesisState {
    params: Params
    accounts: AnyWrap[] = []
    base_account_typeurl: string = ""
    module_account_typeurl: string = ""
    constructor(params: Params, accounts: AnyWrap[], base_account_typeurl: string, module_account_typeurl: string) {
        this.params = params
        this.accounts = accounts
        this.base_account_typeurl = base_account_typeurl
        this.module_account_typeurl = module_account_typeurl
    }
}

@json
export class BaseAccount {
    address: Bech32String
    pub_key: PublicKey | null = null
    account_number: u64 = 0
    sequence: u64 = 0
    constructor(address: Bech32String, pub_key: PublicKey | null, account_number: u64, sequence: u64) {
        this.address = address
        this.pub_key = pub_key
        this.account_number = account_number
        this.sequence = sequence
    }

    static New(addr: Bech32String): BaseAccount {
        return new BaseAccount(addr, null, 0, 0)
    }
}

@json
export class ModuleAccount {
    base_account: BaseAccount
    name: string = ""
    permissions: string[] = []
    constructor(base_account: BaseAccount, name: string, permissions: string[]) {
        this.base_account = base_account
        this.name = name
        this.permissions = permissions
    }
}

@json
export class ModuleCredential {
    module_name: string = ""
    derivation_keys: Base64String[] = []
    constructor(module_name: string, derivation_keys: Base64String[]) {
        this.module_name = module_name
        this.derivation_keys = derivation_keys
    }
}

@json
export class Params {
    max_memo_characters: u64 = 0
    tx_sig_limit: u64 = 0
    tx_size_cost_per_byte: u64 = 0
    sig_verify_cost_ed25519: u64 = 0
    sig_verify_cost_secp256k1: u64 = 0
    constructor(max_memo_characters: u64, tx_sig_limit: u64, tx_size_cost_per_byte: u64, sig_verify_cost_ed25519: u64, sig_verify_cost_secp256k1: u64) {
        this.max_memo_characters = max_memo_characters
        this.tx_sig_limit = tx_sig_limit
        this.tx_size_cost_per_byte = tx_size_cost_per_byte
        this.sig_verify_cost_ed25519 = sig_verify_cost_ed25519
        this.sig_verify_cost_secp256k1 = sig_verify_cost_secp256k1
    }
}

@json
export class MsgUpdateParams {
    authority: string = ""
    params: Params
    constructor(authority: string, params: Params) {
        this.authority = authority
        this.params = params
    }
}

@json
export class MsgUpdateParamsResponse {}

@json
export class MsgSetAccount {
    account: AnyWrap
    constructor(account: AnyWrap) {
        this.account = account
    }
}

@json
export class MsgNewBaseAccount {
    address: Bech32String = ""
    constructor(address: Bech32String) {
        this.address = address
    }
}

@json
export class MsgNewModuleccount {
    address: Bech32String = ""
    name: string = ""
    permissions: string[] = []
    constructor(address: Bech32String, name: string, permissions: string[]) {
        this.address = address
        this.name = name
        this.permissions = permissions
    }
}

@json
export class PageRequest {
    key: u8 = 0
    offset: u64 = 0
    limit: u64 = 0
    count_total: bool = false
    reverse: bool = false
    constructor( key: u8, offset: u64, limit: u64, count_total: bool, reverse: bool) {
        this.key = key
        this.offset = offset
        this.limit = limit
        this.count_total = count_total
        this.reverse = reverse
    }
}

@json
export class PageResponse {
    // next_key: Base64String
    total: u64 = 0
    constructor(total: u64) {
        // this.next_key = next_key
        this.total = total
    }
}

@json
export class QueryAccountsRequest {
    pagination: PageRequest
    constructor(pagination: PageRequest) {
        this.pagination = pagination
    }
}

@json
export class QueryAccountsResponse {
    accounts: AnyWrap[] = []
    pagination: PageResponse
    constructor(accounts: AnyWrap[], pagination: PageResponse) {
        this.accounts = accounts
        this.pagination = pagination
    }
}

@json
export class QueryAccountRequest {
    address: string = ""
    constructor(address: string) {
        this.address = address
    }
}

@json
export class QueryAccountResponse {
    account: AnyWrap | null = null
    constructor(account: AnyWrap | null) {
        this.account = account
    }
}

@json
export class QueryHasAccountResponse {
    found: bool = false
    constructor(found: bool) {
        this.found = found
    }
}

@json
export class QueryAccountAddressByIDRequest {
    id: i64 = 0
    account_id: u64 = 0
    constructor(id: i64, account_id: u64) {
        this.id = id
        this.account_id = account_id
    }
}

@json
export class QueryAccountAddressByIDResponse {
    account_address: string = ""
    constructor(account_address: string) {
        this.account_address = account_address
    }
}

@json
export class QueryParamsRequest {}

@json
export class QueryParamsResponse {
    params: Params
    constructor(params: Params) {
        this.params = params
    }
}

@json
export class QueryModuleAccountsRequest {}

@json
export class QueryModuleAccountsResponse {
    accounts: AnyWrap[] = []
    constructor(accounts: AnyWrap[]) {
        this.accounts = accounts
    }
}

@json
export class QueryModuleAccountByNameRequest {
    name: string = ""
    constructor(name: string) {
        this.name = name
    }
}

@json
export class QueryModuleAccountByNameResponse {
    account: AnyWrap | null = null
    constructor(account: AnyWrap | null) {
        this.account = account
    }
}

@json
export class Bech32PrefixRequest {}

@json
export class Bech32PrefixResponse {
    bech32_prefix: string = ""
    constructor(bech32_prefix: string) {
        this.bech32_prefix = bech32_prefix
    }
}

@json
export class AddressBytesToStringRequest {
    address_bytes: Base64String = ""
    constructor(address_bytes: Base64String) {
        this.address_bytes = address_bytes
    }
}

@json
export class AddressBytesToStringResponse {
    address_string: string = ""
    constructor(address_string: string) {
        this.address_string = address_string
    }
}

@json
export class AddressStringToBytesRequest {
    address_string: string = ""
    constructor(address_string: string) {
        this.address_string = address_string
    }
}

@json
export class AddressStringToBytesResponse {
    address_bytes: Base64String = ""
    constructor(address_bytes: Base64String) {
        this.address_bytes = address_bytes
    }
}

@json
export class QueryAccountInfoRequest {
    address: string = ""
    constructor(address: string) {
        this.address = address
    }
}

@json
export class QueryAccountInfoResponse {
    info: BaseAccount
    constructor(info: BaseAccount) {
        this.info = info
    }
}

export function NewBaseAccount(typeUrl: string, addr: Bech32String): AnyWrap {
    const data = new BaseAccount(addr, null, 0, 0)
    return AnyWrap.New(typeUrl, JSON.stringify<BaseAccount>(data))
}
