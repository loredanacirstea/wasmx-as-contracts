import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";
import { NetworkNode, NodeInfo } from "wasmx-p2p/assembly/types";
import { ChainConfig, ChainId, InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import { BigInt } from "wasmx-env/assembly/bn";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { SubChainData } from "wasmx-multichain-registry/assembly/types";

export const MODULE_NAME = "lobby"

@json
export class Params {
    current_level: i32
    min_validators_count: i32
    enable_eid_check: boolean
    erc20CodeId: u64
    derc20CodeId: u64
    level_initial_balance: BigInt
    constructor(current_level: i32, min_validators_count: i32, enable_eid_check: boolean, erc20CodeId: u64, derc20CodeId: u64, level_initial_balance: BigInt) {
        this.current_level = current_level
        this.min_validators_count = min_validators_count
        this.enable_eid_check = enable_eid_check
        this.erc20CodeId = erc20CodeId
        this.derc20CodeId = derc20CodeId
        this.level_initial_balance = level_initial_balance
    }
}

@json
export class MsgLastChainId {
    id: ChainId
    constructor(id: ChainId) {
        this.id = id
    }
}

@json
export class MsgLastNodeId {
    id: string = ""
    constructor(id: string) {
        this.id = id
    }
}

@json
export class PotentialValidator {
    node: NetworkNode
    addressBytes: Base64String
    consensusPublicKey: Base64String
    constructor(node: NetworkNode, addressBytes: Base64String, consensusPublicKey: Base64String) {
        this.node = node
        this.addressBytes = addressBytes
        this.consensusPublicKey = consensusPublicKey
    }
}

@json
export class PotentialValidatorWithSignature {
    validator: PotentialValidator
    signature: string
    constructor(validator: PotentialValidator, signature: string) {
        this.validator = validator
        this.signature = signature
    }
}

@json
export class MsgNewChainRequest {
    level: i32 = 0
    validator: PotentialValidator
    constructor(level: i32, validator: PotentialValidator) {
        this.level = level
        this.validator = validator
    }
}

@json
export class MsgNewChainAccepted {
    level: i32 = 0
    chainId: ChainId
    validators: PotentialValidator[]
    constructor(level: i32, chainId: ChainId, validators: PotentialValidator[]) {
        this.level = level
        this.chainId = chainId
        this.validators = validators
    }
}

@json
export class MsgNewChainResponse {
    msg: MsgNewChainAccepted
    signatures: Base64String[]
    constructor(msg: MsgNewChainAccepted, signatures: Base64String[]) {
        this.msg = msg
        this.signatures = signatures
    }
}

@json
export class MsgNewChainGenesisData {
    data: SubChainData
    validators: PotentialValidator[]
    signatures: Base64String[] // signature on data.data
    constructor(
        data: SubChainData,
        validators: PotentialValidator[],
        signatures: Base64String[],
    ) {
        this.data = data
        this.validators = validators
        this.signatures = signatures
    }
}

@json
export class CurrentChainSetup {
    data: typestnd.InitChainSetup
    node: NodeInfo
    constructor(data: typestnd.InitChainSetup, node: NodeInfo) {
        this.data = data
        this.node = node
    }
}

@json
export class ChainConfigData {
    chain_id: string
    chain_config: ChainConfig
    constructor(chain_id: string, chain_config: ChainConfig) {
        this.chain_id = chain_id
        this.chain_config = chain_config
    }
}


