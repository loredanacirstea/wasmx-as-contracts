import { JSON } from "json-as";
import { Base64String, Bech32String, Coin, HexString } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn";

export const MODULE_NAME = "erc20"

export const ZERO_ADDRESS = "mythos1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvvnu6d"
export const ZERO_ADDRESS_HEX = "0x0000000000000000000000000000000000000000"

@json
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

@json
export class MsgName {}

@json
export class MsgNameResponse {
    name: string
    constructor(name: string) {
        this.name = name
    }
}

@json
export class MsgSymbol {}

@json
export class MsgSymbolResponse {
    symbol: string
    constructor(symbol: string) {
        this.symbol = symbol
    }
}

@json
export class MsgDecimals {}

@json
export class MsgDecimalsResponse {
    decimals: i32
    constructor(decimals: i32) {
        this.decimals = decimals
    }
}

@json
export class MsgTotalSupply {}

@json
export class MsgTotalSupplyResponse {
    supply: Coin
    constructor(supply: Coin) {
        this.supply = supply
    }
}

@json
export class MsgBalanceOf {
    owner: Bech32String
    constructor(owner: Bech32String) {
        this.owner = owner
    }
}

@json
export class MsgBalanceOfResponse {
    balance: Coin
    constructor(balance: Coin) {
        this.balance = balance
    }
}

@json
export class MsgTransfer {
    to: Bech32String
    value: BigInt
    constructor(to: Bech32String, value: BigInt) {
        this.to = to
        this.value = value
    }
}

@json
export class MsgTransferResponse {}

@json
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

@json
export class MsgTransferFromResponse {}

@json
export class MsgApprove {
    spender: Bech32String
    value: BigInt
    constructor(spender: Bech32String,  value: BigInt) {
        this.spender = spender
        this.value = value
    }
}

@json
export class MsgApproveResponse {
    success: bool
    constructor(success: bool) {
        this.success = success
    }
}

@json
export class MsgAllowance {
    owner: Bech32String
    spender: Bech32String
    constructor(owner: Bech32String, spender: Bech32String) {
        this.owner = owner
        this.spender = spender
    }
}

@json
export class MsgAllowanceResponse {
    remaining: BigInt
    constructor(remaining: BigInt) {
        this.remaining = remaining
    }
}

@json
export class MsgMint {
    to: Bech32String
    value: BigInt
    constructor(to: Bech32String, value: BigInt) {
        this.to = to
        this.value = value
    }
}

@json
export class MsgBurn {
    from: Bech32String
    value: BigInt
    constructor(from: Bech32String, value: BigInt) {
        this.from = from
        this.value = value
    }
}

@json
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
