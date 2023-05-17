import { u256 } from 'as-bignum/assembly';

export type Address = Array<u8>;
export type Bytes32 = Array<u8>;

export class ChainInfo {
    denom: string;
    chainId: u64;
    chainIdFull: string;
    constructor(denom: string, chainId: u64, chainIdFull: string) {
        this.denom = denom;
        this.chainId = chainId;
        this.chainIdFull = chainIdFull;
    }
}

export class BlockInfo {
    height: u64;
    time: u64;
    gasLimit: u64;
    hash: Bytes32;
    proposer: Address;
    constructor(height: u64, time: u64, gasLimit: u64, hash: Bytes32, proposer: Address) {
        this.height = height;
        this.time = time;
        this.gasLimit = gasLimit;
        this.hash = hash;
        this.proposer = proposer;
    }
}

export class TransactionInfo {
    index: u32;
    gasPrice: u256;
    constructor(index: u32, gasPrice: u256) {
        this.index = index;
        this.gasPrice = gasPrice;
    }
}

export class ContractInfo {
    address: Address;
    bytecode: Array<u8>;
    constructor(address: Address, bytecode: Array<u8>) {
        this.address = address;
        this.bytecode = bytecode;
    }
}

export class CurrentCallInfo {
    // origin: Address;
    // sender: Address;
    // funds: u256;
    // isQuery: bool;
    // callData: u8[];
    returnData: u8[] = [];
    returnDataSuccess: u8 = 1; // 0 = success, 1 = revert; 2 = internal error;
    // constructor(origin: Address, sender: Address, funds: u256, isQuery: bool, callData: u8[]) {
    //     this.origin = origin;
    //     this.sender = sender;
    //     this.funds = funds;
    //     this.isQuery = isQuery;
    //     this.callData = callData;
    // }
}

export class Env {
    // chain: ChainInfo;
    // block: BlockInfo;
    // transaction: TransactionInfo;
    contract: ContractInfo;
    currentCall: CurrentCallInfo;
    // constructor(chain: ChainInfo, block: BlockInfo, transaction: TransactionInfo, contract: ContractInfo, currentCall: CurrentCallInfo) {
    //     this.chain = chain;
    //     this.block = block;
    //     this.transaction = transaction;
    //     this.contract = contract;
    //     this.currentCall = currentCall;
    // }
    constructor(contract: ContractInfo) {
        this.contract = contract;
        this.currentCall = new CurrentCallInfo();
    }
}
