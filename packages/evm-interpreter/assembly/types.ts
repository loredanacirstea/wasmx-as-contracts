import { JSON } from "json-as/assembly";
import { BigInt } from "./bn";
import { getAccountInfo } from "./evm";

// TODO typecheck for each
export type Bytes32 = Array<u8>;

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class TransactionInfo {
    index: BigInt;
    gasPrice: BigInt;
    constructor(index: BigInt, gasPrice: BigInt) {
        this.index = index;
        this.gasPrice = gasPrice;
    }
}

// @ts-ignore
@serializable
export class AccountInfo {
    address: BigInt;
    codeHash: BigInt;
    bytecode: Uint8Array;
    constructor(address: BigInt, codeHash: BigInt, bytecode: Uint8Array) {
        this.address = address;
        this.codeHash = codeHash;
        this.bytecode = bytecode;
    }
}

// @ts-ignore
@serializable
export class EvmLog {
    type: string = 'ewasm';
    data: Uint8Array;
    topics: Array<Uint8Array>;
    constructor(data: Uint8Array, topics: Array<Uint8Array>) {
        this.data = data;
        this.topics = topics;
    }
}

// @ts-ignore
@serializable
export class CurrentCallInfo {
    origin: BigInt;
    sender: BigInt;
    funds: BigInt;
    gasLimit: BigInt;
    callData: Uint8Array;
    returnData!: Uint8Array;
    returnDataSuccess: u8 = 1; // 0 = success, 1 = revert; 2 = internal error;
    constructor(origin: BigInt, sender: BigInt, funds: BigInt, gasLimit: BigInt, callData: Uint8Array) {
        this.origin = origin;
        this.sender = sender;
        this.funds = funds;
        this.gasLimit = gasLimit;
        this.callData = callData;
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class CallRequest {
    to: BigInt; // storage changes
    from: BigInt;
    value: BigInt;
    gasLimit: BigInt;
    calldata: Uint8Array;
    bytecode: Uint8Array;
    codeHash: BigInt;
    isQuery: bool;
    constructor(to: BigInt, from: BigInt, value: BigInt, gasLimit: BigInt, calldata: Uint8Array, bytecode: Uint8Array, codeHash: BigInt, isQuery: bool) {
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
export class CallResponse {
    success: u8;  // 0 = success, 1 = revert; 2 = internal error;
    data: Uint8Array;
    constructor(success: u8, data: Uint8Array) {
        this.success = success;
        this.data = data;
    }
}

// @ts-ignore
@serializable
export class CreateAccountRequest {
    bytecode: Uint8Array;
    balance: BigInt;

    constructor(bytecode: Uint8Array, balance: BigInt) {
        this.bytecode = bytecode;
        this.balance = balance;
    }
}

// @ts-ignore
@serializable
export class Create2AccountRequest {
    bytecode: Uint8Array;
    balance: BigInt;
    salt: BigInt;

    constructor(bytecode: Uint8Array, balance: BigInt, salt: BigInt) {
        this.bytecode = bytecode;
        this.balance = balance;
        this.salt = salt;
    }
}
