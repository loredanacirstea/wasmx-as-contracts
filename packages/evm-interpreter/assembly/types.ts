import { u256 } from 'as-bignum/assembly';

// TODO typecheck for each
export type Bytes32 = Array<u8>;

export class ChainInfo {
    denom: string;
    chainId: u256;
    chainIdFull: string;
    constructor(denom: string, chainId: u256, chainIdFull: string) {
        this.denom = denom;
        this.chainId = chainId;
        this.chainIdFull = chainIdFull;
    }
}

export class BlockInfo {
    height: u256;
    time: u256;
    gasLimit: u256;
    hash: u256;
    difficulty: u256;
    proposer: u256;
    constructor(height: u256, time: u256, gasLimit: u256, hash: u256, proposer: u256) {
        this.height = height;
        this.time = time;
        this.gasLimit = gasLimit;
        this.hash = hash;
        this.proposer = proposer;
        this.difficulty = new u256(0);
    }
}

export class TransactionInfo {
    index: u256;
    gasPrice: u256;
    constructor(index: u256, gasPrice: u256) {
        this.index = index;
        this.gasPrice = gasPrice;
    }
}

export class ContractInfo {
    address: u256;
    bytecode: Array<u8>;
    balance: u256
    constructor(address: u256, bytecode: Array<u8>, balance: u256) {
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
    origin: u256;
    sender: u256;
    funds: u256;
    gasLimit: u256;
    isQuery: bool;
    callData: u8[];
    logs: EvmLog[];
    returnData: u8[] = [];
    returnDataSuccess: u8 = 1; // 0 = success, 1 = revert; 2 = internal error;
    constructor(origin: u256, sender: u256, funds: u256, gasLimit: u256, isQuery: bool, callData: u8[]) {
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
