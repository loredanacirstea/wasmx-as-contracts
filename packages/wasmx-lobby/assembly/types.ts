import { JSON } from "json-as/assembly";
import { Base64String } from "wasmx-env/assembly/types";
import { NetworkNode } from "wasmx-p2p/assembly/types";

export const MODULE_NAME = "lobby"

// @ts-ignore
@serializable
export class MsgLastChainId {
    id: string = ""
    level: i32 = 0
    numberid: i64 = 0
    constructor(id: string, level: i32 = 0, numberid: i64 = 0) {
        this.id = id
        this.level = level
        this.numberid = numberid
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
    operatorPublicKey: Base64String
    constructor(node: NetworkNode, operatorPublicKey: Base64String) {
        this.node = node
        this.operatorPublicKey = operatorPublicKey
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
    chainId: i64 = 0
    validators: PotentialValidator[]
    constructor(level: i32, chainId: i64, validators: PotentialValidator[]) {
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
export class ChainPreGenesis {
    genTx: Base64String[]
    signatures: Base64String[]
    constructor(msg: MsgNewChainAccepted, signatures: Base64String[]) {
        this.msg = msg
        this.signatures = signatures
    }
}
