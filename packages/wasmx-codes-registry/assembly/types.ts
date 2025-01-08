import { JSON } from "json-as/assembly";
import { Bech32String, CodeInfo, ContractInfo } from "wasmx-env/assembly/types";

export const MODULE_NAME = "codes-registry"

// @ts-ignore
@serializable
export class GenesisState {
    code_infos: CodeInfo[]
    contract_infos: MsgSetContractInfoRequest[]
    constructor(code_infos: CodeInfo[], contract_infos: MsgSetContractInfoRequest[]) {
        this.code_infos = code_infos
        this.contract_infos = contract_infos
    }
}

// @ts-ignore
@serializable
export class MsgSetNewCodeInfoRequest {
    code_info: CodeInfo
    constructor(code_info: CodeInfo) {
        this.code_info = code_info
    }
}

// @ts-ignore
@serializable
export class MsgSetCodeInfoRequest {
    code_id: u64
    code_info: CodeInfo
    constructor(code_id: u64, code_info: CodeInfo) {
        this.code_id = code_id
        this.code_info = code_info
    }
}

// @ts-ignore
@serializable
export class MsgSetContractInfoRequest {
    address: Bech32String
    contract_info: ContractInfo
    constructor(address: Bech32String, contract_info: ContractInfo) {
        this.address = address
        this.contract_info = contract_info
    }
}

// @ts-ignore
@serializable
export class QueryLastCodeIdResponse {
    code_id: u64
    constructor(code_id: u64) {
        this.code_id = code_id
    }
}

// @ts-ignore
@serializable
export class QueryCodeInfoRequest {
    code_id: u64
    constructor(code_id: u64) {
        this.code_id = code_id
    }
}

// @ts-ignore
@serializable
export class QueryCodeInfoResponse {
    code_info: CodeInfo | null
    constructor(code_info: CodeInfo | null) {
        this.code_info = code_info
    }
}

// @ts-ignore
@serializable
export class QueryContractInfoRequest {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}

// @ts-ignore
@serializable
export class QueryContractInfoResponse {
    contract_info: ContractInfo | null
    constructor(contract_info: ContractInfo | null) {
        this.contract_info = contract_info
    }
}

// @ts-ignore
@serializable
export class QueryContractInstanceRequest {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}

// @ts-ignore
@serializable
export class QueryContractInstanceResponse {
    code_info: CodeInfo
    contract_info: ContractInfo
    constructor(code_info: CodeInfo, contract_info: ContractInfo) {
        this.code_info = code_info
        this.contract_info = contract_info
    }
}
