export declare function getEnv(): ArrayBuffer
export declare function getChainId(): ArrayBuffer
export declare function getCallData(): ArrayBuffer
export declare function getCaller(): ArrayBuffer
export declare function getAddress(): ArrayBuffer
export declare function getBalance(address: ArrayBuffer): ArrayBuffer
export declare function getCurrentBlock(): ArrayBuffer

export declare function storageStore(key: ArrayBuffer, value: ArrayBuffer): void
export declare function storageLoad(key: ArrayBuffer): ArrayBuffer
export declare function storageLoadRange(key: ArrayBuffer): ArrayBuffer
export declare function storageLoadRangePairs(key: ArrayBuffer): ArrayBuffer

export declare function log(value: ArrayBuffer): void
export declare function emitCosmosEvents(value: ArrayBuffer): void
export declare function getFinishData(): ArrayBuffer
export declare function setFinishData(value: ArrayBuffer): void
export declare function finish(value: ArrayBuffer): void
export declare function revert(message: ArrayBuffer): void

export declare function getAccount(address: ArrayBuffer): ArrayBuffer
export declare function call(data: ArrayBuffer): ArrayBuffer

export declare function createAccount(data: ArrayBuffer): ArrayBuffer
export declare function create2Account(data: ArrayBuffer): ArrayBuffer

export declare function sha256(value: ArrayBuffer): ArrayBuffer

export declare function MerkleHash(value: ArrayBuffer): ArrayBuffer

export declare function LoggerInfo(value: ArrayBuffer): void
export declare function LoggerError(value: ArrayBuffer): void
export declare function LoggerDebug(value: ArrayBuffer): void
export declare function LoggerDebugExtended(value: ArrayBuffer): void

export declare function ed25519Sign(privKey: ArrayBuffer, msgbz: ArrayBuffer): ArrayBuffer
export declare function ed25519Verify(pubKey: ArrayBuffer, signature: ArrayBuffer, msgbz: ArrayBuffer): i32
export declare function ed25519PubToHex(pubKey: ArrayBuffer): ArrayBuffer

export declare function addr_humanize(value: ArrayBuffer): ArrayBuffer
export declare function addr_canonicalize(value: ArrayBuffer): ArrayBuffer
export declare function addr_equivalent(addr1: ArrayBuffer, addr2: ArrayBuffer): i32
export declare function addr_humanize_mc(value: ArrayBuffer, prefix: ArrayBuffer): ArrayBuffer
export declare function addr_canonicalize_mc(value: ArrayBuffer): ArrayBuffer

export declare function getAddressByRole(value: ArrayBuffer): ArrayBuffer
export declare function getRoleByAddress(value: ArrayBuffer): ArrayBuffer

export declare function executeCosmosMsg(value: ArrayBuffer): ArrayBuffer

export declare function decodeCosmosTxToJson(value: ArrayBuffer): ArrayBuffer
export declare function verifyCosmosTx(value: ArrayBuffer): ArrayBuffer

// TODO move to p2p and rename to wasmx-network
export declare function grpcRequest(data: ArrayBuffer): ArrayBuffer

// TODO move to a core/internal API; even wasmx-network
export declare function startTimeout(req: ArrayBuffer): void
export declare function cancelTimeout(req: ArrayBuffer): void
export declare function startBackgroundProcess(req: ArrayBuffer): void
export declare function writeToBackgroundProcess(req: ArrayBuffer): ArrayBuffer
export declare function readFromBackgroundProcess(req: ArrayBuffer): ArrayBuffer

// TODO move or remove
export declare function externalCall(data: ArrayBuffer): ArrayBuffer
