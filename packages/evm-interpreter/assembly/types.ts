import { JSON } from "json-as";
import { BigInt } from "./bn";
import { getAccountInfo } from "./evm";

// TODO typecheck for each
export type Bytes32 = Array<u8>;

@json
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

@json
export class BlockInfo {
    height: BigInt;
    timestamp: BigInt;
    gasLimit: BigInt;
    hash: BigInt;
    difficulty: BigInt = BigInt.empty();
    proposer: BigInt;
    constructor(height: BigInt, timestamp: BigInt, gasLimit: BigInt, hash: BigInt, proposer: BigInt) {
        this.height = height;
        this.timestamp = timestamp;
        this.gasLimit = gasLimit;
        this.hash = hash;
        this.proposer = proposer;
    }
}

@json
export class TransactionInfo {
    index: u32;
    gasPrice: BigInt;
    constructor(index: u32, gasPrice: BigInt) {
        this.index = index;
        this.gasPrice = gasPrice;
    }
}

@json
export class AccountInfo {
    address: BigInt;
    codeHash: BigInt;
    bytecode: u8[];
    constructor(address: BigInt, codeHash: BigInt, bytecode: u8[]) {
        this.address = address;
        this.codeHash = codeHash;
        this.bytecode = bytecode;
    }
}

@json
export class EvmLog {
    type: string = 'ewasm';
    data: Uint8Array;
    topics: Array<Uint8Array>;
    constructor(data: Uint8Array, topics: Array<Uint8Array>) {
        this.data = data;
        this.topics = topics;
    }
}

@json
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

@json
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
        this.init();
    }

    init(): void {
        this.accountCache = new Map<string,AccountInfo>();
        this.accountCache.set(this.contract.address.toString(), this.contract);
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

@json
export class CallRequest {
    to: BigInt; // storage changes
    from: BigInt;
    value: BigInt;
    gasLimit: BigInt;
    calldata: Uint8Array;
    bytecode: u8[];
    codeHash: BigInt;
    isQuery: bool;
    constructor(to: BigInt, from: BigInt, value: BigInt, gasLimit: BigInt, calldata: Uint8Array, bytecode: u8[], codeHash: BigInt, isQuery: bool) {
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

@json
export class CallResponse {
    success: u8;  // 0 = success, 1 = revert; 2 = internal error;
    data: Uint8Array;
    constructor(success: u8, data: Uint8Array) {
        this.success = success;
        this.data = data;
    }
}

@json
export class CreateAccountRequest {
    bytecode: Uint8Array;
    balance: BigInt;

    constructor(bytecode: Uint8Array, balance: BigInt) {
        this.bytecode = bytecode;
        this.balance = balance;
    }
}

@json
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
