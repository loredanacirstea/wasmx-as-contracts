import { BigInt } from "./bn";
import { getAccountInfo } from "./evm";

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
    timestamp: BigInt;
    gasLimit: BigInt;
    hash: BigInt;
    difficulty: BigInt;
    proposer: BigInt;
    constructor(height: BigInt, timestamp: BigInt, gasLimit: BigInt, hash: BigInt, proposer: BigInt) {
        this.height = height;
        this.timestamp = timestamp;
        this.gasLimit = gasLimit;
        this.hash = hash;
        this.proposer = proposer;
        this.difficulty = BigInt.fromU32(0);
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

export class AccountInfo {
    address: BigInt;
    codeHash: BigInt;
    bytecode: Array<u8>;
    constructor(address: BigInt, codeHash: BigInt, bytecode: u8[]) {
        this.address = address;
        this.codeHash = codeHash;
        this.bytecode = bytecode;
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
    callData: u8[];
    returnData: u8[] = [];
    returnDataSuccess: u8 = 1; // 0 = success, 1 = revert; 2 = internal error;
    constructor(origin: BigInt, sender: BigInt, funds: BigInt, gasLimit: BigInt, callData: u8[]) {
        this.origin = origin;
        this.sender = sender;
        this.funds = funds;
        this.gasLimit = gasLimit;
        this.callData = callData;
    }
}

export class Env {
    chain: ChainInfo;
    block: BlockInfo;
    transaction: TransactionInfo;
    contract: AccountInfo;
    currentCall: CurrentCallInfo;
    accountCache: Map<string,AccountInfo> = new Map<string,AccountInfo>();

    constructor(chain: ChainInfo, block: BlockInfo, transaction: TransactionInfo, contract: AccountInfo, currentCall: CurrentCallInfo) {
        this.chain = chain;
        this.block = block;
        this.transaction = transaction;
        this.contract = contract;
        this.currentCall = currentCall;
        this.accountCache.set(contract.address.toString(), contract);
    }

    getAccount(address: BigInt): AccountInfo {
        if (this.accountCache.has(address.toString())) {
            return this.accountCache.get(address.toString());
        }
        const account = getAccountInfo(address);
        this.accountCache.set(account.address.toString(), account);
        return account;
    }
}

export class CallRequest {
    to: BigInt; // storage changes
    from: BigInt;
    value: BigInt;
    gasLimit: BigInt;
    calldata: u8[];
    bytecode: u8[];
    codeHash: u8[];
    isQuery: bool;
    constructor(to: BigInt, from: BigInt, value: BigInt, gasLimit: BigInt, calldata: u8[], bytecode: u8[], codeHash: u8[], isQuery: bool) {
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

export class CallResponse {
    success: u8;  // 0 = success, 1 = revert; 2 = internal error;
    data: u8[];
    constructor(success: u8, data: u8[]) {
        this.success = success;
        this.data = data;
    }
}

export class CreateAccountRequest {
    bytecode: u8[];
    balance: BigInt;

    constructor(bytecode: u8[], balance: BigInt) {
        this.bytecode = bytecode;
        this.balance = balance;
    }
}

export class Create2AccountRequest {
    bytecode: u8[];
    balance: BigInt;
    salt: BigInt;

    constructor(bytecode: u8[], balance: BigInt, salt: BigInt) {
        this.bytecode = bytecode;
        this.balance = balance;
        this.salt = salt;
    }
}
