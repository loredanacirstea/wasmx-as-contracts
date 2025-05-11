import { JSON } from "json-as";
import { Bech32String, CodeInfo, ContractInfo } from "wasmx-env/assembly/types";

export const MODULE_NAME = "codes-registry"

@json
export class GenesisState {
    code_infos: CodeInfo[]
    contract_infos: MsgSetContractInfoRequest[]
    constructor(code_infos: CodeInfo[], contract_infos: MsgSetContractInfoRequest[]) {
        this.code_infos = code_infos
        this.contract_infos = contract_infos
    }
}

@json
export class MsgSetNewCodeInfoRequest {
    code_info: CodeInfo
    constructor(code_info: CodeInfo) {
        this.code_info = code_info
    }
}

@json
export class MsgSetCodeInfoRequest {
    code_id: u64
    code_info: CodeInfo
    constructor(code_id: u64, code_info: CodeInfo) {
        this.code_id = code_id
        this.code_info = code_info
    }
}

@json
export class MsgSetContractInfoRequest {
    address: Bech32String
    contract_info: ContractInfo
    constructor(address: Bech32String, contract_info: ContractInfo) {
        this.address = address
        this.contract_info = contract_info
    }
}

@json
export class QueryLastCodeIdResponse {
    code_id: u64
    constructor(code_id: u64) {
        this.code_id = code_id
    }
}

@json
export class QueryCodeInfoRequest {
    code_id: u64
    constructor(code_id: u64) {
        this.code_id = code_id
    }
}

@json
export class QueryCodeInfoResponse {
    code_info: CodeInfo | null
    constructor(code_info: CodeInfo | null) {
        this.code_info = code_info
    }
}

@json
export class QueryContractInfoRequest {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}

@json
export class QueryContractInfoResponse {
    contract_info: ContractInfo | null
    constructor(contract_info: ContractInfo | null) {
        this.contract_info = contract_info
    }
}

@json
export class QueryContractInstanceRequest {
    address: Bech32String
    constructor(address: Bech32String) {
        this.address = address
    }
}

@json
export class QueryContractInstanceResponse {
    code_info: CodeInfo | null
    contract_info: ContractInfo | null
    constructor(code_info: CodeInfo | null, contract_info: ContractInfo | null) {
        this.code_info = code_info
        this.contract_info = contract_info
    }
}
