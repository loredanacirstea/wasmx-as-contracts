// import { JSON } from "json-as";

// @json
// export class ChainInfoJson {
//     denom!: string;
//     chainId!: i32[];
//     chainIdFull!: string;
// }

// @json
// export class BlockInfoJson {
//     height!: i32[];
//     timestamp!: i32[];
//     gasLimit!: i32[];
//     hash!: i32[];
//     proposer!: i32[];
// }

// @json
// export class TransactionInfoJson {
//     index!: i32;
//     gasPrice!: i32[];
// }

// @json
// export class AccountInfoJson {
//     address!: i32[];
//     codeHash!: i32[];
//     bytecode!: i32[];
//     constructor(address: i32[], codeHash: i32[], bytecode: i32[]) {
//         this.address = address;
//         this.codeHash = codeHash;
//         this.bytecode = bytecode;
//     }
// }

// @json
// export class CurrentCallInfoJson {
//     origin!: i32[];
//     sender!: i32[];
//     funds!: i32[];
//     gasLimit!: i32[];
//     callData!: i32[];
// }

// @json
// export class EnvJson {
//     chain!: ChainInfoJson;
//     block!: BlockInfoJson;
//     transaction!: TransactionInfoJson;
//     contract!: AccountInfoJson;
//     currentCall!: CurrentCallInfoJson;
// }

// @json
// export class CallRequestJson {
//     to: i32[];
//     from: i32[];
//     value: i32[];
//     gasLimit: i32[];
//     calldata: i32[];
//     bytecode: i32[];
//     codeHash: i32[];
//     isQuery: bool;
//     constructor(to: i32[], from: i32[], value: i32[], gasLimit: i32[], calldata: i32[], bytecode: i32[], codeHash: i32[], isQuery: bool) {
//         this.to = to;
//         this.from = from;
//         this.value = value;
//         this.gasLimit = gasLimit;
//         this.calldata = calldata;
//         this.bytecode = bytecode;
//         this.codeHash = codeHash;
//         this.isQuery = isQuery;
//     }
// }

// @json
// export class CallResponseJson {
//     success: i32; // 0 = success, 1 = revert; 2 = internal error;
//     data: i32[];
//     constructor(success: i32, data: i32[]) {
//         this.success = success;
//         this.data = data;
//     }
// }

// @json
// export class CreateAccountRequestJson {
//     bytecode: i32[];
//     balance: i32[];

//     constructor(bytecode: i32[], balance: i32[]) {
//         this.bytecode = bytecode;
//         this.balance = balance;
//     }
// }

// @json
// export class Create2AccountRequestJson {
//     bytecode: i32[];
//     balance: i32[];
//     salt: i32[];

//     constructor(bytecode: i32[], balance: i32[], salt: i32[]) {
//         this.bytecode = bytecode;
//         this.balance = balance;
//         this.salt = salt;
//     }
// }

// @json
// export class EvmLogJson {
//     type: string = 'ewasm';
//     data: i32[];
//     topics: i32[][];
//     constructor(data: i32[], topics: i32[][]) {
//         this.data = data;
//         this.topics = topics;
//     }
// }
