import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, Coin } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn"

export const MODULE_NAME = "auth"

// @ts-ignore
@serializable
export class MsgInitGenesis {
    params: Params
    accounts: AnyAccount[]
    constructor(params: Params, accounts: AnyAccount[]) {
        this.params = params
        this.accounts = accounts
    }
}

// @ts-ignore
@serializable
export class AnyPubKey {
    anytype: string
    key: Base64String
    constructor(type: string, key: Base64String) {
        this.anytype = type;
        this.key = key
    }
}

// @ts-ignore
@serializable
export class BaseAccount {
    address: Bech32String
    pub_key: AnyPubKey
    account_number: u64
    sequence: u64
    constructor(address: Bech32String, pub_key: AnyPubKey, account_number: u64, sequence: u64) {
        this.address = address
        this.pub_key = pub_key
        this.account_number = account_number
        this.sequence = sequence
    }
}

// @ts-ignore
@serializable
export class StoredAccount extends BaseAccount {}

// @ts-ignore
@serializable
export class AnyAccount extends BaseAccount {
    anytype: string
    constructor(anytype: string, address: Bech32String, pub_key: AnyPubKey, account_number: u64, sequence: u64) {
        super(address, pub_key, account_number, sequence);
        this.anytype = anytype
    }
}

// @ts-ignore
@serializable
export class ModuleAccount {
    base_account: BaseAccount
    name: string
    permissions: string[]
    constructor(base_account: BaseAccount, name: string, permissions: string[]) {
        this.base_account = base_account
        this.name = name
        this.permissions = permissions
    }
}

// @ts-ignore
@serializable
export class ModuleCredential {
    module_name: string
    derivation_keys: Base64String[]
    constructor(module_name: string, derivation_keys: Base64String[]) {
        this.module_name = module_name
        this.derivation_keys = derivation_keys
    }
}

// @ts-ignore
@serializable
export class Params {
    max_memo_characters: u64
    tx_sig_limit: u64
    tx_size_cost_per_byte: u64
    sig_verify_cost_ed25519: u64
    sig_verify_cost_secp256k1: u64
    constructor(max_memo_characters: u64, tx_sig_limit: u64, tx_size_cost_per_byte: u64, sig_verify_cost_ed25519: u64, sig_verify_cost_secp256k1: u64) {
        this.max_memo_characters = max_memo_characters
        this.tx_sig_limit = tx_sig_limit
        this.tx_size_cost_per_byte = tx_size_cost_per_byte
        this.sig_verify_cost_ed25519 = sig_verify_cost_ed25519
        this.sig_verify_cost_secp256k1 = sig_verify_cost_secp256k1
    }
}

// @ts-ignore
@serializable
export class MsgUpdateParams {
    authority: string
    params: Params
    constructor(authority: string, params: Params) {
        this.authority = authority
        this.params = params
    }
}

// @ts-ignore
@serializable
export class MsgUpdateParamsResponse {}

// @ts-ignore
@serializable
export class MsgSetAccount {
    address: Bech32String
    pub_key: AnyPubKey
    sequence: u64
    constructor(address: Bech32String, pub_key: AnyPubKey, sequence: u64) {
        this.address = address
        this.pub_key = pub_key
        this.sequence = sequence
    }
}

// @ts-ignore
@serializable
export class PageRequest {
    key: u8
    offset: u64
    limit: u64
    count_total: bool
    reverse: bool
    constructor( key: u8, offset: u64, limit: u64, count_total: bool, reverse: bool) {
        this.key = key
        this.offset = offset
        this.limit = limit
        this.count_total = count_total
        this.reverse = reverse
    }
}

// @ts-ignore
@serializable
export class PageResponse {
    // next_key: Base64String
    total: u64
    constructor(total: u64) {
        // this.next_key = next_key
        this.total = total
    }
}

// @ts-ignore
@serializable
export class QueryAccountsRequest {
    pagination: PageRequest
    constructor(pagination: PageRequest) {
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QueryAccountsResponse {
    accounts: AnyAccount[]
    pagination: PageResponse
    constructor(accounts: AnyAccount[], pagination: PageResponse) {
        this.accounts = accounts
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QueryAccountRequest {
    address: string
    constructor(address: string) {
        this.address = address
    }
}

// @ts-ignore
@serializable
export class QueryAccountResponse {
    account: StoredAccount
    constructor(account: StoredAccount) {
        this.account = account
    }
}

// @ts-ignore
@serializable
export class QueryAccountAddressByIDRequest {
    id: i64
    account_id: u64
    constructor(id: i64, account_id: u64) {
        this.id = id
        this.account_id = account_id
    }
}

// @ts-ignore
@serializable
export class QueryAccountAddressByIDResponse {
    account_address: string
    constructor(account_address: string) {
        this.account_address = account_address
    }
}

// @ts-ignore
@serializable
export class QueryParamsRequest {}

// @ts-ignore
@serializable
export class QueryParamsResponse {
    params: Params
    constructor(params: Params) {
        this.params = params
    }
}

// @ts-ignore
@serializable
export class QueryModuleAccountsRequest {}

// @ts-ignore
@serializable
export class QueryModuleAccountsResponse {
    accounts: AnyAccount[]
    constructor(accounts: AnyAccount[]) {
        this.accounts = accounts
    }
}

// @ts-ignore
@serializable
export class QueryModuleAccountByNameRequest {
    name: string
    constructor(name: string) {
        this.name = name
    }
}

// @ts-ignore
@serializable
export class QueryModuleAccountByNameResponse {
    account: AnyAccount
    constructor(account: AnyAccount) {
        this.account = account
    }
}

// @ts-ignore
@serializable
export class Bech32PrefixRequest {}

// @ts-ignore
@serializable
export class Bech32PrefixResponse {
    bech32_prefix: string
    constructor(bech32_prefix: string) {
        this.bech32_prefix = bech32_prefix
    }
}

// @ts-ignore
@serializable
export class AddressBytesToStringRequest {
    address_bytes: Base64String
    constructor(address_bytes: Base64String) {
        this.address_bytes = address_bytes
    }
}

// @ts-ignore
@serializable
export class AddressBytesToStringResponse {
    address_string: string
    constructor(address_string: string) {
        this.address_string = address_string
    }
}

// @ts-ignore
@serializable
export class AddressStringToBytesRequest {
    address_string: string
    constructor(address_string: string) {
        this.address_string = address_string
    }
}

// @ts-ignore
@serializable
export class AddressStringToBytesResponse {
    address_bytes: Base64String
    constructor(address_bytes: Base64String) {
        this.address_bytes = address_bytes
    }
}

// @ts-ignore
@serializable
export class QueryAccountInfoRequest {
    address: string
    constructor(address: string) {
        this.address = address
    }
}

// @ts-ignore
@serializable
export class QueryAccountInfoResponse {
    info: BaseAccount
    constructor(info: BaseAccount) {
        this.info = info
    }
}
