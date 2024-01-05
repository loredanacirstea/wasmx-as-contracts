export declare function getEnv(): ArrayBuffer
export declare function getCallData(): ArrayBuffer
export declare function getCaller(): ArrayBuffer
export declare function getAddress(): ArrayBuffer
export declare function getBalance(address: ArrayBuffer): ArrayBuffer

export declare function storageStore(key: ArrayBuffer, value: ArrayBuffer): void
export declare function storageLoad(key: ArrayBuffer): ArrayBuffer

export declare function log(value: ArrayBuffer): void
export declare function getReturnData(): ArrayBuffer
export declare function setReturnData(value: ArrayBuffer): void
export declare function finish(value: ArrayBuffer): void
export declare function revert(message: ArrayBuffer): void

export declare function getAccount(address: ArrayBuffer): ArrayBuffer
export declare function externalCall(data: ArrayBuffer): ArrayBuffer
export declare function call(data: ArrayBuffer): ArrayBuffer

export declare function grpcRequest(data: ArrayBuffer): ArrayBuffer
export declare function startTimeout(time: i64, args: ArrayBuffer): void

export declare function sha256(value: ArrayBuffer): ArrayBuffer

export declare function MerkleHash(value: ArrayBuffer): ArrayBuffer

export declare function LoggerInfo(value: ArrayBuffer): void
export declare function LoggerError(value: ArrayBuffer): void
export declare function LoggerDebug(value: ArrayBuffer): void

export declare function ed25519Sign(privKey: ArrayBuffer, msgbz: ArrayBuffer): ArrayBuffer
export declare function ed25519Verify(pubKey: ArrayBuffer, signature: ArrayBuffer, msgbz: ArrayBuffer): i32
