import { JSON } from "json-as/assembly";

// @ts-ignore
@serializable
export class ChainInfoJson {
    denom!: string;
    chainId!: i32[];
    chainIdFull!: string;
}

// @ts-ignore
@serializable
export class BlockInfoJson {
    height!: i32[];
    time!: i32[];
    gasLimit!: i32[];
    hash!: i32[];
    proposer!: i32[];
}

// @ts-ignore
@serializable
export class TransactionInfoJson {
    index!: i32;
    gasPrice!: i32[];
}

// @ts-ignore
@serializable
export class ContractInfoJson {
    address!: i32[];
    bytecode!: i32[];
}

// @ts-ignore
@serializable
export class CurrentCallInfoJson {
    origin!: i32[];
    sender!: i32[];
    funds!: i32[];
    gasLimit!: i32[];
    isQuery!: bool;
    callData!: i32[];
}

// @ts-ignore
@serializable
export class EnvJson {
    chain!: ChainInfoJson;
    block!: BlockInfoJson;
    transaction!: TransactionInfoJson;
    contract!: ContractInfoJson;
    currentCall!: CurrentCallInfoJson;
}
