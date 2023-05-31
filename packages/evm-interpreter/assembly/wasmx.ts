export declare function getEnv(): ArrayBuffer

export declare function storageStore(key: ArrayBuffer, value: ArrayBuffer): void
export declare function storageLoad(key: ArrayBuffer): ArrayBuffer

export declare function log(value: ArrayBuffer): void
export declare function finish(value: ArrayBuffer): void
export declare function revert(message: ArrayBuffer): void

export declare function getBlockHash(number: ArrayBuffer): ArrayBuffer
export declare function getAccount(address: ArrayBuffer): ArrayBuffer
export declare function getBalance(address: ArrayBuffer): ArrayBuffer
export declare function createAccount(account: ArrayBuffer): ArrayBuffer
export declare function create2Account(account: ArrayBuffer): ArrayBuffer

export declare function externalCall(data: ArrayBuffer): ArrayBuffer

// export declare function keccak256(contextOffset: i32, inputOffset: i32, inputLength: i32, outputOffset: i32): void
// export declare function keccak256(value: ArrayBuffer): ArrayBuffer


// // TODO
// export declare function selfDestruct(address: Address): void
// export declare function useGas(value: u64): void
// export declare function refundGas(value: u64): void




