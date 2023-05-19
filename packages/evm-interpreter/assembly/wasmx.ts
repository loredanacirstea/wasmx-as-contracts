export declare function getEnv(): ArrayBuffer

export declare function storageStore(key: ArrayBuffer, value: ArrayBuffer): void
export declare function storageLoad(key: ArrayBuffer): ArrayBuffer

export declare function log(value: ArrayBuffer): void
export declare function finish(value: ArrayBuffer): void
export declare function revert(message: ArrayBuffer): void

export declare function getExternalBalance(address: ArrayBuffer): ArrayBuffer
export declare function getExternalCodeSize(address: ArrayBuffer): ArrayBuffer
export declare function getExternalCodeHash(address: ArrayBuffer): ArrayBuffer
export declare function getExternalCode(address: ArrayBuffer): ArrayBuffer
// replace above
// export declare function getAccount(address: Address): ArrayBuffer

export declare function getBlockHash(number: ArrayBuffer): ArrayBuffer


// // TODO
// export declare function externalCall(): void

// export declare function getAddress(): Address
// export declare function getCaller(): Address
// export declare function getCallValue(): BigInt
// export declare function getCallData(): ArrayBuffer
// export declare function getCallDataSize(): i64
// export declare function callDataLoad(): Bytes32
// export declare function callDataCopy(
//     resultOffset: i64,
//     dataOffset: i64,
//     length: i64,
// ): ArrayBuffer
// export declare function getCodeSize(): i32
// export declare function codeCopy(
//     resultOffset: i64,
//     codeOffset: i64,
//     length: i64,
// ): Address
// export declare function externalCodeCopy(
//     address: Address,
//     resultOffset: i64,
//     codeOffset: i64,
//     length: i64,
// ): Address

// export declare function getBlockCoinbase(): Address
// export declare function getBlockDifficulty(): Bytes32

// export declare function call(
//     gas_limit: i64,
//     address: Address,
//     value: BigInt,
//     dataOffset: i64,
//     dataLength: i64,
//     outputOffset: i64,
//     outputLength: i64,
// ): i32
// export declare function callDelegate(
//     gas_limit: i64,
//     address: Address,
//     dataOffset: i64,
//     dataLength: i64,
//     outputOffset: i64,
//     outputLength: i64,
// ): i32
// export declare function callStatic(
//     gas_limit: i64,
//     address: Address,
//     dataOffset: i64,
//     dataLength: i64,
//     outputOffset: i64,
//     outputLength: i64,
// ): i32
// export declare function callCode(
//     gas_limit: i64,
//     address: Address,
//     value: BigInt,
//     dataOffset: i64,
//     dataLength: i64,
//     outputOffset: i64,
//     outputLength: i64,
// ): i32
// export declare function create(
//     value: BigInt,
//     dataOffset: i64,
//     dataLength: i64,
// ): i32
// export declare function selfDestruct(address: Address): void
// export declare function keccak256(offset: i64, length: i64): Bytes32

// export declare function useGas(value: u64): void
// export declare function refundGas(value: u64): void




