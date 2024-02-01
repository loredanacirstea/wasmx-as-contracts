import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, HexString } from 'wasmx-env/assembly/types';

// @ts-ignore
@serializable
export class CallDataInstantiate {
    admins: Base64String[]
    minters: Base64String[]
    name: string
    symbol: string
    decimals: i32
    constructor(admins: Base64String[], minters: Base64String[], name: string, symbol: string,  decimals: i32) {
        this.admins = admins
        this.minters = minters
        this.name = name
        this.symbol = symbol
        this.decimals = decimals
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
    totalSupply: i64
    constructor(totalSupply: i64) {
        this.totalSupply = totalSupply
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
    balance: i64
    constructor(balance: i64) {
        this.balance = balance
    }
}

// @ts-ignore
@serializable
export class MsgTransfer {
    to: Bech32String
    value: i64
    constructor(to: Bech32String, value: i64) {
        this.to = to
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgTransferResponse {
    success: bool
    constructor(success: bool) {
        this.success = success
    }
}

// @ts-ignore
@serializable
export class MsgTransferFrom {
    from: Bech32String
    to: Bech32String
    value: i64
    constructor(from: Bech32String, to: Bech32String, value: i64) {
        this.from = from
        this.to = to
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgTransferFromResponse {
    success: bool
    constructor(success: bool) {
        this.success = success
    }
}

// @ts-ignore
@serializable
export class MsgApprove {
    spender: Bech32String
    value: i64
    constructor(spender: Bech32String,  value: i64) {
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
    remaining: i64
    constructor(remaining: i64) {
        this.remaining = remaining
    }
}

// @ts-ignore
@serializable
export class MsgMint {
    to: Bech32String
    value: i64
    constructor(to: Bech32String, value: i64) {
        this.to = to
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
