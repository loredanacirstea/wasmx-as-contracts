import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import { Base64String, ContractStorageType } from "wasmx-env/assembly/types";

export const MODULE_NAME = "wasmx-core-env"

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class WriteToBackgroundProcessResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class ReadFromBackgroundProcessResponse {
    error: string
    data: Base64String
    constructor(error: string, data: Base64String) {
        this.error = error
        this.data = data
    }
}

// @ts-ignore
@serializable
export class GrpcResponse {
    data: string // base64
    error: string
    constructor(data: string, error: string) {
        this.data = data;
        this.error = error;
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class CancelTimeoutRequest {
    id: string
    constructor(id: string) {
        this.id = id
    }
}

// @ts-ignore
@serializable
export class MigrateContractStateByStorageRequest {
    contract_address: string
    source_storage_type: ContractStorageType
    target_storage_type: ContractStorageType
    constructor(contract_address: string, source_storage_type: ContractStorageType, target_storage_type: ContractStorageType) {
        this.contract_address = contract_address
        this.source_storage_type = source_storage_type
        this.target_storage_type = target_storage_type
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class GlobalStorageLoadRequest {
    store_key: string
    key: Base64String
    constructor(store_key: string, key: Base64String) {
        this.store_key = store_key
        this.key = key
    }
}

// @ts-ignore
@serializable
export class GlobalStorageResetRequest {
    store_key: string
    constructor(store_key: string) {
        this.store_key = store_key
    }
}

// @ts-ignore
@serializable
export class GlobalStorageResetResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}
