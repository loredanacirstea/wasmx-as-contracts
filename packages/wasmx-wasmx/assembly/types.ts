import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, CodeInfo, ContractInfo, ContractStorage, HexString, SystemContract } from "wasmx-env/assembly/types";

// @ts-ignore
@serializable
export class Params {}

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
