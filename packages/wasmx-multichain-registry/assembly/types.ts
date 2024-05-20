import { JSON } from "json-as/assembly";
import { InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import { Base64String, Coin } from "wasmx-env/assembly/types";
import * as authtypes from "wasmx-auth/assembly/types";
import * as banktypes from "wasmx-bank/assembly/types";
import * as stakingtypes from "wasmx-stake/assembly/types";
import * as govtypes from "wasmx-gov/assembly/types";
import * as slashingtypes from "wasmx-slashing/assembly/types";
import * as distributiontypes from "wasmx-distribution/assembly/types";

export const MODULE_NAME = "multichain_registry"

export const DEFAULT_MIN_VALIDATORS_COUNT = 3;
export const DEFAULT_EID_CHECK = false;
export const DEFAULT_ERC20_CODE_ID = 27;
export const DEFAULT_DERC20_CODE_ID = 28;

// @ts-ignore
@serializable
export class MsgInitialize {
    params: Params
    constructor(params: Params) {
        this.params = params
    }
}

// @ts-ignore
@serializable
export class Params {
    min_validators_count: i32
    enable_eid_check: bool
    erc20CodeId: u64
    derc20CodeId: u64
    constructor(min_validators_count: i32, enable_eid_check: bool, erc20CodeId: u64, derc20CodeId: u64) {
        this.min_validators_count = min_validators_count
        this.enable_eid_check = enable_eid_check
        this.erc20CodeId = erc20CodeId
        this.derc20CodeId = derc20CodeId
    }
}

// @ts-ignore
@serializable
export class SubChainData {
    data: InitSubChainDeterministicRequest
    genTxs: Base64String[] // json format!!
    balances: Coin[]
    initialized: bool
    constructor(data: InitSubChainDeterministicRequest, genTxs: Base64String[], balances: Coin[]) {
        this.data = data
        this.genTxs = genTxs
        this.balances = balances
        this.initialized = false
    }
}

// @ts-ignore
@serializable
export class QueryGetSubChainsRequest {}

// @ts-ignore
@serializable
export class QueryGetSubChainsByIdsRequest {
    ids: string[]
    constructor(ids: string[]) {
        this.ids = ids
    }
}

// @ts-ignore
@serializable
export class QueryGetSubChainIdsRequest {}

// @ts-ignore
@serializable
export class QueryGetSubChainRequest {
    chainId: string
    constructor(chainId: string) {
        this.chainId = chainId
    }
}

// @ts-ignore
@serializable
export class RegisterDefaultSubChainRequest {
    denom_unit: string
    base_denom_unit: u32
    chain_base_name: string
    level_index: u32
    balances: Coin[]
    gen_txs: Base64String[]
    constructor(
        denom_unit: string,
        base_denom_unit: u32,
        chain_base_name: string,
        level_index: u32,
        balances: Coin[],
        gen_txs: Base64String[],
    ) {
        this.denom_unit = denom_unit
        this.base_denom_unit = base_denom_unit
        this.chain_base_name = chain_base_name
        this.level_index = level_index
        this.balances = balances
        this.gen_txs = gen_txs
    }
}

// @ts-ignore
@serializable
export class RegisterSubChainRequest {
    data: InitSubChainDeterministicRequest
    genTxs: Base64String[]
    balances: Coin[]
    constructor(data: InitSubChainDeterministicRequest, genTxs: Base64String[], balances: Coin[]) {
        this.data = data
        this.genTxs = genTxs
        this.balances = balances
    }
}

// @ts-ignore
@serializable
export class RemoveSubChainRequest {
    chainId: string
    constructor(chainId: string) {
        this.chainId = chainId
    }
}

// @ts-ignore
@serializable
export class RegisterSubChainValidatorRequest {
    chainId: string
    genTx: Base64String
    constructor(chainId: string, genTx: Base64String) {
        this.chainId = chainId
        this.genTx = genTx
    }
}

// @ts-ignore
@serializable
export class InitSubChainRequest {
    chainId: string
    constructor(chainId: string) {
        this.chainId = chainId
    }
}

// @ts-ignore
@serializable
export class CosmosmodGenesisState {
    staking: stakingtypes.GenesisState
    bank: banktypes.GenesisState
    gov: govtypes.GenesisState
    auth: authtypes.GenesisState
    slashing: slashingtypes.GenesisState
    distribution: distributiontypes.GenesisState
    constructor(
        staking: stakingtypes.GenesisState,
        bank: banktypes.GenesisState,
        gov: govtypes.GenesisState,
        auth: authtypes.GenesisState,
        slashing: slashingtypes.GenesisState,
        distribution: distributiontypes.GenesisState,
    ) {
        this.staking = staking
        this.bank = bank
        this.gov = gov
        this.auth = auth
        this.slashing = slashing
        this.distribution = distribution
    }
}
