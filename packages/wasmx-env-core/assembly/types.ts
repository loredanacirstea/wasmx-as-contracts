import { JSON } from "json-as";
import * as base64 from "as-base64/assembly";
import { Base64String, Bech32String, CodeInfo, ContractInfo, ContractStorageType } from "wasmx-env/assembly/types";

export const MODULE_NAME = "wasmx-core-env"

@json
export class StartBackgroundProcessRequest {
    contract: string
    args: Base64String
    constructor(
        contract: string,
        args: Base64String,
    ) {
        this.contract = contract
        this.args = args
    }
}

@json
export class StartBackgroundProcessResponse {
    error: string
    data: Base64String
    constructor(
        error: string,
        data: Base64String,
    ) {
        this.error = error
        this.data = data
    }
}

@json
export class WriteToBackgroundProcessRequest {
    contract: string // role or address
    data: Base64String
    ptrFunc: string
    constructor(
        contract: string,
        data: Base64String,
        ptrFunc: string,
    ) {
        this.contract = contract
        this.data = data
        this.ptrFunc = ptrFunc
    }
}

@json
export class WriteToBackgroundProcessResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}

@json
export class ReadFromBackgroundProcessRequest {
    contract: string // role or address
    ptrFunc: string
    lenFunc: string
    constructor(
        contract: string,
        ptrFunc: string,
        lenFunc: string,
    ) {
        this.contract = contract
        this.lenFunc = lenFunc
        this.ptrFunc = ptrFunc
    }
}

@json
export class ReadFromBackgroundProcessResponse {
    error: string
    data: Base64String
    constructor(error: string, data: Base64String) {
        this.error = error
        this.data = data
    }
}

@json
export class GrpcResponse {
    data: string // base64
    error: string
    constructor(data: string, error: string) {
        this.data = data;
        this.error = error;
    }
}

@json
export class StartTimeoutRequest {
    id: string
	contract: string
	delay: i64
	args: Base64String
    constructor(id: string, contract: string, delay: i64, args: Base64String) {
        this.id = id
        this.contract = contract
        this.delay = delay
        this.args = args
    }
}

@json
export class CancelTimeoutRequest {
    id: string
    constructor(id: string) {
        this.id = id
    }
}

@json
export class MigrateContractStateByStorageRequest {
    contract_address: string
    source_storage_type: string
    target_storage_type: string
    constructor(contract_address: string, source_storage_type: string, target_storage_type: string) {
        this.contract_address = contract_address
        this.source_storage_type = source_storage_type
        this.target_storage_type = target_storage_type
    }
}

@json
export class MigrateContractStateByAddressRequest {
    source_contract_address: string
    target_contract_address: string
    source_storage_type: string
    target_storage_type: string
    constructor(source_contract_address: string, target_contract_address: string, source_storage_type: string, target_storage_type: string) {
        this.source_contract_address = source_contract_address
        this.target_contract_address = target_contract_address
        this.source_storage_type = source_storage_type
        this.target_storage_type = target_storage_type
    }
}

@json
export class GlobalStorageStoreRequest {
    store_key: string
    key: Base64String
    value: Base64String
    constructor(store_key: string, key: Base64String, value: Base64String) {
        this.store_key = store_key
        this.key = key
        this.value = value
    }
}

@json
export class GlobalStorageLoadRequest {
    store_key: string
    key: Base64String
    constructor(store_key: string, key: Base64String) {
        this.store_key = store_key
        this.key = key
    }
}

@json
export class GlobalStorageResetRequest {
    store_key: string
    constructor(store_key: string) {
        this.store_key = store_key
    }
}

@json
export class GlobalStorageResetResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}

@json
export class UpdateSystemCacheRequest {
    role_address: Bech32String = ""
    code_registry_address: Bech32String = ""
    code_registry_id: u64 = 0
    code_registry_code_info: CodeInfo | null = null
    code_registry_contract_info: ContractInfo | null = null
    constructor(
        role_address: Bech32String = "",
        code_registry_address: Bech32String = "",
        code_registry_id: u64 = 0,
        code_registry_code_info: CodeInfo | null = null,
        code_registry_contract_info: ContractInfo | null = null,
    ) {
        this.role_address = role_address
        this.code_registry_address = code_registry_address
        this.code_registry_id = code_registry_id
        this.code_registry_code_info = code_registry_code_info
        this.code_registry_contract_info = code_registry_contract_info
    }
}

@json
export class UpdateSystemCacheResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}
