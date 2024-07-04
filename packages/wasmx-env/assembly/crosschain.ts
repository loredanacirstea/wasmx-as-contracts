// TODO move this to a system API package
// this API can only be used by a core contract, like the multichain registry
export declare function executeCrossChainTx(req: ArrayBuffer): ArrayBuffer
export declare function executeCrossChainQuery(req: ArrayBuffer): ArrayBuffer
export declare function executeCrossChainQueryNonDeterministic(req: ArrayBuffer): ArrayBuffer
export declare function executeCrossChainTxNonDeterministic(req: ArrayBuffer): ArrayBuffer
export declare function isAtomicTxInExecution(req: ArrayBuffer): ArrayBuffer
