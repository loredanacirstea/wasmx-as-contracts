export declare function grpcRequest(data: ArrayBuffer): ArrayBuffer
export declare function startTimeout(req: ArrayBuffer): void
export declare function cancelTimeout(req: ArrayBuffer): void
export declare function startBackgroundProcess(req: ArrayBuffer): void
export declare function writeToBackgroundProcess(req: ArrayBuffer): ArrayBuffer
export declare function readFromBackgroundProcess(req: ArrayBuffer): ArrayBuffer
export declare function externalCall(data: ArrayBuffer): ArrayBuffer
export declare function migrateContractStateByStorageType(data: ArrayBuffer): void
export declare function migrateContractStateByAddress(data: ArrayBuffer): void

export declare function storageLoadGlobal(req: ArrayBuffer): ArrayBuffer
export declare function storageStoreGlobal(address: ArrayBuffer): void
export declare function storageDeleteGlobal(address: ArrayBuffer): void
export declare function storageHasGlobal(address: ArrayBuffer): i32
export declare function storageResetGlobal(address: ArrayBuffer): ArrayBuffer

export declare function updateSystemCache(req: ArrayBuffer): ArrayBuffer
