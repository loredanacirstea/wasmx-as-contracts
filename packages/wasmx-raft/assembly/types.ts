import { JSON } from "json-as";
import * as stakingtypes from "wasmx-stake/assembly/types";

@json
export class CosmosmodGenesisState {
    staking: stakingtypes.GenesisState
    constructor(staking: stakingtypes.GenesisState) {
        this.staking = staking
    }
}

@json
export class IsNodeValidator {
    isvalidator: boolean
    nodeIndex: i32
    constructor(isvalidator: boolean, nodeIndex: i32) {
        this.isvalidator = isvalidator
        this.nodeIndex = nodeIndex
    }
}
