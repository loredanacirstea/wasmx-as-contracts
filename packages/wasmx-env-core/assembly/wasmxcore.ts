export declare function grpcRequest(data: ArrayBuffer): ArrayBuffer
export declare function startTimeout(req: ArrayBuffer): void
export declare function cancelTimeout(req: ArrayBuffer): void
export declare function startBackgroundProcess(req: ArrayBuffer): void
export declare function writeToBackgroundProcess(req: ArrayBuffer): ArrayBuffer
export declare function readFromBackgroundProcess(req: ArrayBuffer): ArrayBuffer
export declare function externalCall(data: ArrayBuffer): ArrayBuffer
export declare function migrateContractStateByStorageType(data: ArrayBuffer): void
export declare function setContractInfo(address: ArrayBuffer, data: ArrayBuffer): void
