import { JSON } from "json-as";
import { Base64String, Bech32String, HexString } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn";
import { Coin } from "wasmx-env/assembly/types"

export const MODULE_NAME = "bank"

export type CoinMap = Map<string,BigInt>

@json
export class DenomUnit_ {
    denom: string
    value: BigInt // 10^exponent
    constructor(denom: string, value: BigInt) {
        this.denom = denom
        this.value = value
    }
}

@json
export class DenomInfo {
    denom: string
    value: BigInt // 10^exponent
    contract: Bech32String
    constructor(denom: string, value: BigInt, contract: Bech32String) {
        this.denom = denom
        this.value = value
        this.contract = contract
    }
}

@json
export class Input {
    address: string
    coins: Coin[]
    constructor(address: string, coins: Coin[]) {
        this.address = address
        this.coins = coins
    }
}

@json
export class Output {
    address: string
    coins: Coin[]
    constructor(address: string, coins: Coin[]) {
        this.address = address
        this.coins = coins
    }
}

@json
export class MsgSend {
    from_address: Bech32String
    to_address: Bech32String
    amount: Coin[]
    constructor(from_address: Bech32String, to_address: Bech32String, amount: Coin[]) {
        this.from_address = from_address
        this.to_address = to_address
        this.amount = amount
    }
}

@json
export class MsgSendResponse {}

@json
export class MsgMultiSend {
    // Inputs, despite being `repeated`, only allows one sender input.
    // input coins must be = to sum of output coins
    // allows sending from 1 account to many
    inputs: Input[]
    outputs: Output[]
    constructor(inputs: Input[], outputs: Output[]) {
        this.inputs = inputs
        this.outputs = outputs
    }
}

@json
export class MsgMultiSendResponse {}

@json
export class MsgUpdateParams {
    authority: string
    params: Params
    constructor(authority: string, params: Params) {
        this.authority = authority
        this.params = params
    }
}

@json
export class MsgUpdateParamsResponse {}

@json
export class MsgSetSendEnabled {
    authority: string
    send_enabled: SendEnabled[]
    use_default_for: string[]
    constructor(authority: string, send_enabled: SendEnabled[], use_default_for: string[]) {
        this.authority = authority
        this.send_enabled = send_enabled
        this.use_default_for = use_default_for
    }
}

@json
export class MsgSetSendEnabledResponse {}

@json
export class SendEnabled {
    denom: string
    enabled: bool
    constructor(denom: string, enabled: bool) {
        this.denom = denom
        this.enabled = enabled
    }
}

@json
export class Balance {
    address: Bech32String
    coins: Coin[]
    constructor(address: Bech32String, coins: Coin[]) {
        this.address = address
        this.coins = coins
    }
}

@json
export class Params {
    default_send_enabled: bool
    send_enabled: SendEnabled[]
    constructor(default_send_enabled: bool, send_enabled: SendEnabled[]) {
        this.default_send_enabled = default_send_enabled
        this.send_enabled = send_enabled
    }
}

@json
export class DenomUnit {
    denom: string
    exponent: u32
    aliases: string[]
    constructor(denom: string, exponent: u32, aliases: string[]) {
        this.denom = denom
        this.exponent = exponent
        this.aliases = aliases
    }
}

@json
export class Metadata {
    description: string
    denom_units: DenomUnit[]
    base: string
    display: string
    name: string
    symbol: string
    uri: string
    uri_hash: string
    constructor(description: string, denom_units: DenomUnit[], base: string, display: string, name: string, symbol: string, uri: string, uri_hash: string) {
        this.description = description
        this.denom_units = denom_units
        this.base = base
        this.display = display
        this.name = name
        this.symbol = symbol
        this.uri = uri
        this.uri_hash = uri_hash
    }
}

@json
export class GenesisState {
    // params defines all the parameters of related to deposit.
    params: Params
    balances: Balance[]
    supply: Coin[]
    denom_info: DenomDeploymentInfo[]
    send_enabled: SendEnabled[]
    constructor(params: Params, balances: Balance[],  supply: Coin[], denom_info: DenomDeploymentInfo[], send_enabled: SendEnabled[]) {
        this.params = params
        this.balances = balances
        this.supply = supply
        this.denom_info = denom_info
        this.send_enabled = send_enabled
    }
}

@json
export class DenomDeploymentInfo {
    metadata: Metadata
    code_id: u64
    admins: string[]
    minters: string[]
    contract: Bech32String
    base_denom: string
    constructor(metadata: Metadata, code_id: u64, admins: string[], minters: string[], contract: Bech32String, base_denom: string) {
        this.metadata = metadata
        this.code_id = code_id
        this.admins = admins
        this.minters = minters
        this.contract = contract
        this.base_denom = base_denom
    }
}

@json
export class MsgRegisterDenom {
    contract: Bech32String
    metadata: Metadata
    constructor(contract: Bech32String, metadata: Metadata) {
        this.contract = contract
        this.metadata = metadata
    }
}

@json
export class MsgMintCoins {
    address: Bech32String
    coins: Coin[]
    constructor(address: Bech32String, coins: Coin[]) {
        this.address = address
        this.coins = coins
    }
}

@json
export class CallDataInstantiate {
    authorities: string[]
    constructor(authorities: string[]) {
        this.authorities = authorities
    }
}

@json
export class QueryBalanceRequest {
    address: string
    denom: string
    constructor(address: string, denom: string) {
        this.address = address
        this.denom = denom
    }
}

@json
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

@json
export class PageResponse {
    // next_key: Base64String
    total: u64
    constructor(total: u64) {
        // this.next_key = next_key
        this.total = total
    }
}

@json
export class QueryBalanceResponse {
    balance: Coin
    constructor(balance: Coin) {
        this.balance = balance
    }
}

@json
export class QueryAllBalancesRequest {
    address: string
    pagination: PageRequest
    resolve_denom: bool
    constructor(address: string, pagination: PageRequest, resolve_denom: bool) {
        this.address = address
        this.pagination = pagination
        this.resolve_denom = resolve_denom
    }
}

@json
export class QueryAllBalancesResponse {
    balances: Coin[]
    pagination: PageResponse
    constructor(balances: Coin[], pagination: PageResponse) {
        this.balances = balances
        this.pagination = pagination
    }
}

@json
export class QuerySpendableBalancesRequest {}

@json
export class QuerySpendableBalancesResponse {}

@json
export class QuerySpendableBalanceByDenomRequest {}

@json
export class QuerySpendableBalanceByDenomResponse {}

@json
export class QueryTotalSupplyRequest {
    pagination: PageRequest
    constructor(pagination: PageRequest) {
        this.pagination = pagination
    }
}

@json
export class QueryTotalSupplyResponse {
    supply: Coin[]
    pagination: PageResponse
    constructor(supply: Coin[], pagination: PageResponse) {
        this.supply = supply
        this.pagination = pagination
    }
}

@json
export class QuerySupplyOfRequest {
    denom: string
    constructor(denom: string) {
        this.denom = denom
    }
}

@json
export class QuerySupplyOfResponse {
    amount: Coin
    constructor(amount: Coin) {
        this.amount = amount
    }
}

@json
export class QueryParamsRequest {}

@json
export class QueryParamsResponse {}

@json
export class QueryDenomMetadataRequest {}

@json
export class QueryDenomMetadataResponse {}

@json
export class QueryDenomMetadataByQueryStringRequest {}

@json
export class QueryDenomMetadataByQueryStringResponse {}

@json
export class QueryDenomsMetadataRequest {}

@json
export class QueryDenomsMetadataResponse {}

@json
export class QueryDenomOwnersRequest {}

@json
export class QueryDenomOwnersResponse {}

@json
export class QuerySendEnabledRequest {}

@json
export class QuerySendEnabledResponse {}

@json
export class QueryAddressByDenom {
    denom: string
    constructor(denom: string) {
        this.denom = denom
    }
}

@json
export class QueryAddressByDenomResponse {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}
