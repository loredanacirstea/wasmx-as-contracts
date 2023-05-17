import { JSON } from "json-as/assembly";

export type Address = u8[];
export type Bytes32 = u8[];

// @ts-ignore
@serializable
export class ChainInfoJson {
    denom!: string;
    chainId!: string; // i64
    chainIdFull!: string;
}

// @ts-ignore
@serializable
export class BlockInfoJson {
    height!: string; // u64
    time!: string; // u64
    gasLimit!: string; // u64
    hash!: Bytes32;
    proposer!: Address;
}

// @ts-ignore
@serializable
export class TransactionInfoJson {
    index!: i32;
    gasPrice!: u8[]; // u256
}

// @ts-ignore
@serializable
export class ContractInfoJson {
    // address!: Address;
    bytecode!: u8[];
}

// @ts-ignore
@serializable
export class CurrentCallInfoJson {
    origin!: Address;
    sender!: Address;
    funds!: u8[]; // u256
    isQuery!: bool;
    callData!: u8[];
}

// @ts-ignore
@serializable
export class EnvJson {
    // chain!: ChainInfoJson;
    // block!: BlockInfoJson;
    // transaction!: TransactionInfoJson;
    contract!: ContractInfoJson;
    // currentCall!: CurrentCallInfoJson;
}
