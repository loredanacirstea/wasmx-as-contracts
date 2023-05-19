import { BigInt } from "as-bigint/assembly";

// TODO typecheck for each
export type Bytes32 = Array<u8>;

export class ChainInfo {
    denom: string;
    chainId: BigInt;
    chainIdFull: string;
    constructor(denom: string, chainId: BigInt, chainIdFull: string) {
        this.denom = denom;
        this.chainId = chainId;
        this.chainIdFull = chainIdFull;
    }
}

export class BlockInfo {
    height: BigInt;
    time: BigInt;
    gasLimit: BigInt;
    hash: BigInt;
    difficulty: BigInt;
    proposer: BigInt;
    constructor(height: BigInt, time: BigInt, gasLimit: BigInt, hash: BigInt, proposer: BigInt) {
        this.height = height;
        this.time = time;
        this.gasLimit = gasLimit;
        this.hash = hash;
        this.proposer = proposer;
        this.difficulty = BigInt.from(0);
    }
}

export class TransactionInfo {
    index: BigInt;
    gasPrice: BigInt;
    constructor(index: BigInt, gasPrice: BigInt) {
        this.index = index;
        this.gasPrice = gasPrice;
    }
}

export class ContractInfo {
    address: BigInt;
    bytecode: Array<u8>;
    balance: BigInt
    constructor(address: BigInt, bytecode: Array<u8>, balance: BigInt) {
        this.address = address;
        this.bytecode = bytecode;
        this.balance = balance;
    }
}

export class EvmLog {
    data: u8[];
    topics: u8[][];
    constructor(data: u8[], topics: u8[][]) {
        this.data = data;
        this.topics = topics;
    }
}

export class CurrentCallInfo {
    origin: BigInt;
    sender: BigInt;
    funds: BigInt;
    gasLimit: BigInt;
    isQuery: bool;
    callData: u8[];
    logs: EvmLog[];
    returnData: u8[] = [];
    returnDataSuccess: u8 = 1; // 0 = success, 1 = revert; 2 = internal error;
    constructor(origin: BigInt, sender: BigInt, funds: BigInt, gasLimit: BigInt, isQuery: bool, callData: u8[]) {
        this.origin = origin;
        this.sender = sender;
        this.funds = funds;
        this.gasLimit = gasLimit;
        this.isQuery = isQuery;
        this.callData = callData;
        this.logs = [];
    }
}

export class Env {
    chain: ChainInfo;
    block: BlockInfo;
    transaction: TransactionInfo;
    contract: ContractInfo;
    currentCall: CurrentCallInfo;
    constructor(chain: ChainInfo, block: BlockInfo, transaction: TransactionInfo, contract: ContractInfo, currentCall: CurrentCallInfo) {
        this.chain = chain;
        this.block = block;
        this.transaction = transaction;
        this.contract = contract;
        this.currentCall = currentCall;
    }
}
