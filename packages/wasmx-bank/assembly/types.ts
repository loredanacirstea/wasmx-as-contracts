import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, HexString } from 'wasmx-env/assembly/types';

export type CoinMap = Map<string,i64>

// @ts-ignore
@serializable
export class Coin {
    denom: string
    amount: i64 // TODO Int, at least u128
    constructor(denom: string, amount: i64) {
        this.denom = denom
        this.amount = amount
    }
}

// @ts-ignore
@serializable
export class DenomUnit_ {
    denom: string
    value: i64 // 10^exponent TODO Int, at least u128
    constructor(denom: string, value: i64) {
        this.denom = denom
        this.value = value
    }
}

// @ts-ignore
@serializable
export class DenomInfo {
    denom: string
    value: i64 // 10^exponent TODO Int, at least u128
    contract: Bech32String
    constructor(denom: string, value: i64, contract: Bech32String) {
        this.denom = denom
        this.value = value
        this.contract = contract
    }
}

// @ts-ignore
@serializable
export class Input {
    address: string
    coins: Coin[]
    constructor(address: string, coins: Coin[]) {
        this.address = address
        this.coins = coins
    }
}

// @ts-ignore
@serializable
export class Output {
    address: string
    coins: Coin[]
    constructor(address: string, coins: Coin[]) {
        this.address = address
        this.coins = coins
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class MsgSendResponse {}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class MsgMultiSendResponse {}

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

// @ts-ignore
@serializable
export class MsgSetSendEnabledResponse {}

// @ts-ignore
@serializable
export class SendEnabled {
    denom: string
    enabled: bool
    constructor(denom: string, enabled: bool) {
        this.denom = denom
        this.enabled = enabled
    }
}

// @ts-ignore
@serializable
export class Balance {
    address: Bech32String
    coins: Coin[]
    constructor(address: Bech32String, coins: Coin[]) {
        this.address = address
        this.coins = coins
    }
}

// @ts-ignore
@serializable
export class Params {
    default_send_enabled: bool
    send_enabled: SendEnabled[]
    constructor(default_send_enabled: bool, send_enabled: SendEnabled[]) {
        this.default_send_enabled = default_send_enabled
        this.send_enabled = send_enabled
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class BankInitGenesis {
    // params defines all the parameters of related to deposit.
    params: Params
    balances: Balance[]
    supply: Coin[]
    denom_metadata: Metadata[]
    send_enabled: SendEnabled[]
    constructor(params: Params, balances: Balance[],  supply: Coin[], denom_metadata: Metadata[], send_enabled: SendEnabled[]) {
        this.params = params
        this.balances = balances
        this.supply = supply
        this.denom_metadata = denom_metadata
        this.send_enabled = send_enabled
    }
}

// @ts-ignore
@serializable
export class Deployment {
    code_id: u64
    admins: string[]
    minters: string[]
    constructor(code_id: u64, admins: string[], minters: string[]) {
        this.code_id = code_id
        this.admins = admins
        this.minters = minters
    }
}

// @ts-ignore
@serializable
export class MsgInitGenesis {
    genesis: BankInitGenesis
    deployments: Deployment[]
    constructor(genesis: BankInitGenesis, deployments: Deployment[]) {
        this.genesis = genesis
        this.deployments = deployments
    }
}

// @ts-ignore
@serializable
export class MsgRegisterDenom {
    contract: Bech32String
    metadata: Metadata
    constructor(contract: Bech32String, metadata: Metadata) {
        this.contract = contract
        this.metadata = metadata
    }
}

// @ts-ignore
@serializable
export class CallDataInstantiate {
    authorities: string[]
    constructor(authorities: string[]) {
        this.authorities = authorities
    }
}

// @ts-ignore
@serializable
export class QueryBalanceRequest {
    address: string
    denom: string
    constructor(address: string, denom: string) {
        this.address = address
        this.denom = denom
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
export class QueryBalanceResponse {
    balance: Coin
    constructor(balance: Coin) {
        this.balance = balance
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class QueryAllBalancesResponse {
    balances: Coin[]
    pagination: PageResponse
    constructor(balances: Coin[], pagination: PageResponse) {
        this.balances = balances
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QuerySpendableBalancesRequest {}

// @ts-ignore
@serializable
export class QuerySpendableBalancesResponse {}

// @ts-ignore
@serializable
export class QuerySpendableBalanceByDenomRequest {}

// @ts-ignore
@serializable
export class QuerySpendableBalanceByDenomResponse {}

// @ts-ignore
@serializable
export class QueryTotalSupplyRequest {
    pagination: PageRequest
    constructor(pagination: PageRequest) {
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QueryTotalSupplyResponse {
    supply: Coin[]
    pagination: PageResponse
    constructor(supply: Coin[], pagination: PageResponse) {
        this.supply = supply
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QuerySupplyOfRequest {}

// @ts-ignore
@serializable
export class QuerySupplyOfResponse {}

// @ts-ignore
@serializable
export class QueryParamsRequest {}

// @ts-ignore
@serializable
export class QueryParamsResponse {}

// @ts-ignore
@serializable
export class QueryDenomMetadataRequest {}

// @ts-ignore
@serializable
export class QueryDenomMetadataResponse {}

// @ts-ignore
@serializable
export class QueryDenomMetadataByQueryStringRequest {}

// @ts-ignore
@serializable
export class QueryDenomMetadataByQueryStringResponse {}

// @ts-ignore
@serializable
export class QueryDenomsMetadataRequest {}

// @ts-ignore
@serializable
export class QueryDenomsMetadataResponse {}

// @ts-ignore
@serializable
export class QueryDenomOwnersRequest {}

// @ts-ignore
@serializable
export class QueryDenomOwnersResponse {}

// @ts-ignore
@serializable
export class QuerySendEnabledRequest {}

// @ts-ignore
@serializable
export class QuerySendEnabledResponse {}

// @ts-ignore
@serializable
export class QueryAddressByDenom {
    denom: string
    constructor(denom: string) {
        this.denom = denom
    }
}

// @ts-ignore
@serializable
export class QueryAddressByDenomResponse {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}
