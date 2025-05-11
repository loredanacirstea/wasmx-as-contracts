import { JSON } from "json-as";
import { BigInt } from "wasmx-env/assembly/bn";
import { Base64String, Bech32String, Coin } from "wasmx-env/assembly/types";

export const MODULE_NAME = "erc20rollup"

@json
export class CallDataInstantiate {
    admins: Bech32String[]
    minters: Bech32String[]
    name: string
    symbol: string
    decimals: i32
    base_denom: string
    sub_chain_ids: string[]
    constructor(admins: Bech32String[], minters: Bech32String[], name: string, symbol: string,  decimals: i32,  base_denom: string, sub_chain_ids: string[]) {
        this.admins = admins
        this.minters = minters
        this.name = name
        this.symbol = symbol
        this.decimals = decimals
        this.base_denom = base_denom
        this.sub_chain_ids = sub_chain_ids
    }
}

@json
export class MsgTotalSupplyCrossChain {}

@json
export class CoinPerChain {
    chain_id: string = ""
    value: BigInt = BigInt.zero()
    constructor(chain_id: string, value: BigInt) {
        this.chain_id = chain_id
        this.value = value
    }
}

@json
export class MsgTotalSupplyCrossChainResponse {
    supply: Coin
    chains: CoinPerChain[]
    constructor(supply: Coin, chains: CoinPerChain[]) {
        this.supply = supply
        this.chains = chains
    }
}

@json
export class MsgBalanceOfCrossChain {
    owner: Bech32String
    constructor(owner: Bech32String) {
        this.owner = owner
    }
}

@json
export class MsgBalanceOfCrossChainResponse {
    balance: Coin
    chains: CoinPerChain[]
    constructor(balance: Coin, chains: CoinPerChain[]) {
        this.balance = balance
        this.chains = chains
    }
}

@json
export class MsgTransferCrossChain {
    to: Bech32String
    to_chain: string
    value: BigInt
    constructor(to: Bech32String, to_chain: string, value: BigInt) {
        this.to = to
        this.to_chain = to_chain
        this.value = value
    }
}

@json
export class MsgTransferCrossChainResponse {}

@json
export class MsgTransferFromCrossChain {
    from: Bech32String
    to: Bech32String
    to_chain: string
    value: BigInt
    constructor(from: Bech32String, to: Bech32String, to_chain: string, value: BigInt) {
        this.from = from
        this.to = to
        this.to_chain = to_chain
        this.value = value
    }
}

@json
export class MsgTransferFromCrossChainResponse {}
