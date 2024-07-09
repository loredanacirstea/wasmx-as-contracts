export declare function CheckTx(value: ArrayBuffer): ArrayBuffer
export declare function PrepareProposal(value: ArrayBuffer): ArrayBuffer
export declare function OptimisticExecution(request: ArrayBuffer, response: ArrayBuffer): ArrayBuffer
export declare function ProcessProposal(value: ArrayBuffer): ArrayBuffer
export declare function FinalizeBlock(value: ArrayBuffer): ArrayBuffer
export declare function BeginBlock(value: ArrayBuffer): ArrayBuffer
export declare function EndBlock(value: ArrayBuffer): ArrayBuffer
export declare function Commit(): ArrayBuffer
export declare function RollbackToVersion(height: i64): ArrayBuffer
