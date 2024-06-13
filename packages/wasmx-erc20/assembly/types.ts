import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, Coin, HexString } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn";

export const MODULE_NAME = "erc20"

export const ZERO_ADDRESS = "mythos1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvvnu6d"
export const ZERO_ADDRESS_HEX = "0x0000000000000000000000000000000000000000"

// @ts-ignore
@serializable
export class CallDataInstantiate {
    admins: Bech32String[]
    minters: Bech32String[]
    name: string
    symbol: string
    decimals: i32
    base_denom: string
    constructor(admins: Bech32String[], minters: Bech32String[], name: string, symbol: string,  decimals: i32,  base_denom: string) {
        this.admins = admins
        this.minters = minters
        this.name = name
        this.symbol = symbol
        this.decimals = decimals
        this.base_denom = base_denom
    }
}

// @ts-ignore
@serializable
export class MsgName {}

// @ts-ignore
@serializable
export class MsgNameResponse {
    name: string
    constructor(name: string) {
        this.name = name
    }
}

// @ts-ignore
@serializable
export class MsgSymbol {}

// @ts-ignore
@serializable
export class MsgSymbolResponse {
    symbol: string
    constructor(symbol: string) {
        this.symbol = symbol
    }
}

// @ts-ignore
@serializable
export class MsgDecimals {}

// @ts-ignore
@serializable
export class MsgDecimalsResponse {
    decimals: i32
    constructor(decimals: i32) {
        this.decimals = decimals
    }
}

// @ts-ignore
@serializable
export class MsgTotalSupply {}

// @ts-ignore
@serializable
export class MsgTotalSupplyResponse {
    supply: Coin
    constructor(supply: Coin) {
        this.supply = supply
    }
}

// @ts-ignore
@serializable
export class MsgBalanceOf {
    owner: Bech32String
    constructor(owner: Bech32String) {
        this.owner = owner
    }
}

// @ts-ignore
@serializable
export class MsgBalanceOfResponse {
    balance: Coin
    constructor(balance: Coin) {
        this.balance = balance
    }
}

// @ts-ignore
@serializable
export class MsgTransfer {
    to: Bech32String
    value: BigInt
    constructor(to: Bech32String, value: BigInt) {
        this.to = to
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgTransferResponse {}

// @ts-ignore
@serializable
export class MsgTransferFrom {
    from: Bech32String
    to: Bech32String
    value: BigInt
    constructor(from: Bech32String, to: Bech32String, value: BigInt) {
        this.from = from
        this.to = to
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgTransferFromResponse {}

// @ts-ignore
@serializable
export class MsgApprove {
    spender: Bech32String
    value: BigInt
    constructor(spender: Bech32String,  value: BigInt) {
        this.spender = spender
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgApproveResponse {
    success: bool
    constructor(success: bool) {
        this.success = success
    }
}

// @ts-ignore
@serializable
export class MsgAllowance {
    owner: Bech32String
    spender: Bech32String
    constructor(owner: Bech32String, spender: Bech32String) {
        this.owner = owner
        this.spender = spender
    }
}

// @ts-ignore
@serializable
export class MsgAllowanceResponse {
    remaining: BigInt
    constructor(remaining: BigInt) {
        this.remaining = remaining
    }
}

// @ts-ignore
@serializable
export class MsgMint {
    to: Bech32String
    value: BigInt
    constructor(to: Bech32String, value: BigInt) {
        this.to = to
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgBurn {
    from: Bech32String
    value: BigInt
    constructor(from: Bech32String, value: BigInt) {
        this.from = from
        this.value = value
    }
}

// @ts-ignore
@serializable
export class TokenInfo {
    name: string
    symbol: string
    decimals: i32
    constructor(name: string, symbol: string,  decimals: i32) {
        this.name = name
        this.symbol = symbol
        this.decimals = decimals
    }
}
