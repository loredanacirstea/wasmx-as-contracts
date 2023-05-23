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
export class AccountInfoJson {
    address!: i32[];
    balance!: i32[];
    codeHash!: i32[];
    bytecode!: i32[];
    constructor(address: i32[], balance: i32[], codeHash: i32[], bytecode: i32[]) {
        this.address = address;
        this.balance = balance;
        this.codeHash = codeHash;
        this.bytecode = bytecode;
    }
}

// @ts-ignore
@serializable
export class CurrentCallInfoJson {
    origin!: i32[];
    sender!: i32[];
    funds!: i32[];
    gasLimit!: i32[];
    callData!: i32[];
}

// @ts-ignore
@serializable
export class EnvJson {
    chain!: ChainInfoJson;
    block!: BlockInfoJson;
    transaction!: TransactionInfoJson;
    contract!: AccountInfoJson;
    currentCall!: CurrentCallInfoJson;
}

// @ts-ignore
@serializable
export class CallRequestJson {
    to: i32[];
    from: i32[];
    value: i32[];
    gasLimit: i32[];
    calldata: i32[];
    bytecode: i32[];
    codeHash: i32[];
    isQuery: bool;
    constructor(to: i32[], from: i32[], value: i32[], gasLimit: i32[], calldata: i32[], bytecode: i32[], codeHash: i32[], isQuery: bool) {
        this.to = to;
        this.from = from;
        this.value = value;
        this.gasLimit = gasLimit;
        this.calldata = calldata;
        this.bytecode = bytecode;
        this.codeHash = codeHash;
        this.isQuery = isQuery;
    }
}

// @ts-ignore
@serializable
export class CallResponseJson {
    success: i32; // 0 = success, 1 = revert; 2 = internal error;
    data: i32[];
    constructor(success: i32, data: i32[]) {
        this.success = success;
        this.data = data;
    }
}
