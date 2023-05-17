import { JSON } from "json-as/assembly";
import { u256 } from 'as-bignum/assembly';

export type Address = ArrayBuffer;
export type Bytes32 = ArrayBuffer;

// @ts-ignore
@serializable
export class ChainInfo {
    denom!: string;
    chainId!: u64;
    chainIdFull!: string;
}

// @ts-ignore
@serializable
export class BlockInfo {
    height!: u64;
    time!: u64;
    gasLimit!: u64;
    hash!: Bytes32;
    proposer!: Address;
}

// @ts-ignore
@serializable
export class TransactionInfo {
    index!: u32;
    gasPrice!: u256;
}

// @ts-ignore
@serializable
export class ContractInfo {
    address!: Address;
    bytecode!: Array<u8>;
}

// @ts-ignore
@serializable
export class CurrentCallInfo {
    origin!: Address;
    sender!: Address;
    funds!: u256;
    isQuery!: bool;
    callData!: Array<u8>;
    returnData!: Array<u8>;
    returnDataSuccess!: u8; // 0 = success, 1 = revert; 2 = internal error;
}

// @ts-ignore
@serializable
export class Env {
    chain!: ChainInfo;
    block!: BlockInfo;
    transaction!: TransactionInfo;
    contract!: ContractInfo;
    currentCall!: CurrentCallInfo;
}
