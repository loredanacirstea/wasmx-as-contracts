import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, HexString } from "wasmx-env/assembly/types";

// @ts-ignore
@serializable
export class Params {}

// @ts-ignore
@serializable
export class CodeOrigin {
    chain_id: string
    address: Bech32String
    constructor(chain_id: string, address: Bech32String) {
        this.chain_id = chain_id
        this.address = address
    }
}

// @ts-ignore
@serializable
export class CodeMetadata {
    name: string = ""
    categ: string[] = []
    icon: string = ""
    author: string = ""
    site: string = ""
    abi: string = ""
    json_schema: string = ""
    origin: CodeOrigin | null = null
    constructor(
        name: string,
        categ: string[],
        icon: string,
        author: string,
        site: string,
        abi: string,
        json_schema: string,
        origin: CodeOrigin | null,
    ) {
        this.name = name
        this.categ = categ
        this.icon = icon
        this.author = author
        this.site = site
        this.abi = abi
        this.json_schema = json_schema
        this.origin = origin
    }

    static Empty(): CodeMetadata {
        return new CodeMetadata("", [], "", "", "", "", "", null)
    }
}

// @ts-ignore
@serializable
export class SystemContract {
    address: string
    label: string
    storage_type: string
    init_message: Base64String
    pinned: boolean
    native: boolean
    role: string
    deps: string[]
    metadata: CodeMetadata
    constructor(
        address: string,
        label: string,
        storage_type: string,
        init_message: Base64String,
        pinned: boolean,
        native: boolean,
        role: string,
        deps: string[],
        metadata: CodeMetadata,
    ) {
        this.address = address
        this.label = label
        this.storage_type = storage_type
        this.init_message = init_message
        this.pinned = pinned
        this.native = native
        this.role = role
        this.deps = deps
        this.metadata = metadata
    }
}

// @ts-ignore
@serializable
export class CodeInfo {
    code_hash: Base64String
    creator: Bech32String
    deps: string[]
    pinned: boolean
    metadata: CodeMetadata
    interpreted_bytecode_deployment: Base64String
    interpreted_bytecode_runtime: Base64String
    runtime_hash: Base64String
    constructor(
        code_hash: Base64String,
        creator: Bech32String,
        deps: string[],
        pinned: boolean,
        metadata: CodeMetadata,
        interpreted_bytecode_deployment: Base64String,
        interpreted_bytecode_runtime: Base64String,
        runtime_hash: Base64String,
    ) {
        this.code_hash = code_hash
        this.creator = creator
        this.deps = deps
        this.pinned = pinned
        this.metadata = metadata
        this.interpreted_bytecode_deployment = interpreted_bytecode_deployment
        this.interpreted_bytecode_runtime = interpreted_bytecode_runtime
        this.runtime_hash = runtime_hash
    }
}

// @ts-ignore
@serializable
export class Code {
    code_id: u64
    code_info: CodeInfo
    code_bytes: Base64String
    constructor(
        code_id: u64,
        code_info: CodeInfo,
        code_bytes: Base64String,
    ) {
        this.code_id = code_id
        this.code_info = code_info
        this.code_bytes = code_bytes
    }
}

// @ts-ignore
@serializable
export class ContractInfo {
    code_id: u64
    creator: Bech32String
    label: string
    storage_type: string
    init_message: Base64String
    provenance: string
    ibc_port_id: string

    constructor(
        code_id: u64,
        creator: Bech32String,
        label: string,
        storage_type: string,
        init_message: Base64String,
        provenance: string,
        ibc_port_id: string,
    ) {
        this.code_id = code_id
        this.creator = creator
        this.label = label
        this.storage_type = storage_type
        this.init_message = init_message
        this.provenance = provenance
        this.ibc_port_id = ibc_port_id
    }
}

// @ts-ignore
@serializable
export class ContractStorage {
    key: HexString
    value: Base64String
    constructor(key: HexString, value: Base64String) {
        this.key = key
        this.value = value
    }
}

// @ts-ignore
@serializable
export class Contract {
    contract_address: Bech32String
    contract_info: ContractInfo
    contract_state: ContractStorage[]
    constructor(
        contract_address: Bech32String,
        contract_info: ContractInfo,
        contract_state: ContractStorage[],
    ) {
        this.contract_address = contract_address
        this.contract_info = contract_info
        this.contract_state = contract_state
    }
}

// @ts-ignore
@serializable
export class Sequence {
    id_key: Base64String
    value: u64
    constructor(id_key: Base64String, value: u64) {
        this.id_key = id_key
        this.value = value
    }
}

// @ts-ignore
@serializable
export class GenesisState {
    params: Params
    bootstrap_account_address: Bech32String
    system_contracts: SystemContract[]
    codes: Code[]
    contracts: Contract[]
    sequences: Sequence[]
    compiled_folder_path: string
    constructor(
        params: Params,
        bootstrap_account_address: Bech32String,
        system_contracts: SystemContract[],
        codes: Code[],
        contracts: Contract[],
        sequences: Sequence[],
        compiled_folder_path: string,
    ) {
        this.params = params
        this.bootstrap_account_address = bootstrap_account_address
        this.system_contracts = system_contracts
        this.codes = codes
        this.contracts = contracts
        this.sequences = sequences
        this.compiled_folder_path = compiled_folder_path
    }
}

// @ts-ignore
@serializable
export enum ContractStorageType {
    CoreConsensus = 0,
    MetaConsensus = 1,
    SingleConsensus = 2,
    Memory = 3,
    Transient = 4,
}

export const StorageCoreConsensus = "CoreConsensus"
export const StorageMetaConsensus = "MetaConsensus"
export const StorageSingleConsensus = "SingleConsensus"
export const StorageMemory = "Memory"
export const StorageTransient = "Transient"

export const ContractStorageTypeByString = new Map<string, ContractStorageType>();
ContractStorageTypeByString.set(StorageCoreConsensus, ContractStorageType.CoreConsensus);
ContractStorageTypeByString.set(StorageMetaConsensus, ContractStorageType.MetaConsensus);
ContractStorageTypeByString.set(StorageSingleConsensus, ContractStorageType.SingleConsensus);
ContractStorageTypeByString.set(StorageMemory, ContractStorageType.Memory);
ContractStorageTypeByString.set(StorageTransient, ContractStorageType.Transient);

export const ContractStorageTypeByEnum = new Map<ContractStorageType, string>();
ContractStorageTypeByEnum.set(ContractStorageType.CoreConsensus, StorageCoreConsensus);
ContractStorageTypeByEnum.set(ContractStorageType.MetaConsensus, StorageMetaConsensus);
ContractStorageTypeByEnum.set(ContractStorageType.SingleConsensus, StorageSingleConsensus);
ContractStorageTypeByEnum.set(ContractStorageType.Memory, StorageMemory);
ContractStorageTypeByEnum.set(ContractStorageType.Transient, StorageTransient);
