import { JSON } from "json-as/assembly";
import { Base64String } from "wasmx-env/assembly/types";
import { NetworkNode, NodeInfo } from "wasmx-p2p/assembly/types";
import { ChainId, InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import { BigInt } from "wasmx-env/assembly/bn";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { SubChainData } from "wasmx-multichain-registry/assembly/types";

export const MODULE_NAME = "lobby"

// @ts-ignore
@serializable
export class MsgLastChainId {
    id: ChainId
    constructor(id: ChainId) {
        this.id = id
    }
}

// @ts-ignore
@serializable
export class MsgLastNodeId {
    id: string = ""
    constructor(id: string) {
        this.id = id
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class PotentialValidatorWithSignature {
    validator: PotentialValidator
    signature: string
    constructor(validator: PotentialValidator, signature: string) {
        this.validator = validator
        this.signature = signature
    }
}

// @ts-ignore
@serializable
export class MsgNewChainRequest {
    level: i32 = 0
    validator: PotentialValidator
    constructor(level: i32, validator: PotentialValidator) {
        this.level = level
        this.validator = validator
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class MsgNewChainResponse {
    msg: MsgNewChainAccepted
    signatures: Base64String[]
    constructor(msg: MsgNewChainAccepted, signatures: Base64String[]) {
        this.msg = msg
        this.signatures = signatures
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class CurrentChainSetup {
    data: typestnd.InitChainSetup
    node: NodeInfo
    constructor(data: typestnd.InitChainSetup, node: NodeInfo) {
        this.data = data
        this.node = node
    }
}
