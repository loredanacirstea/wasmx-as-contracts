// export const precompiles = new Map<string,string>();

// export const precompiles = {
//     '0000000000000000000000000000000000000001': 'ecrecover',
//     '0000000000000000000000000000000000000002': 'sha256',
//     '0000000000000000000000000000000000000003': 'ripemd160',
//     '0000000000000000000000000000000000000004': 'identity',
//     '0000000000000000000000000000000000000005': 'modexp',
//     '0000000000000000000000000000000000000006': 'ecadd',
//     '0000000000000000000000000000000000000007': 'ecmul',
//     '0000000000000000000000000000000000000008': 'ecpairing',
//     '0000000000000000000000000000000000000009': 'blake2f',
// }

export class OpcodeInfo {
    name!: string;
    arity!: i32;
}

export const opByCode = new Map<u8,OpcodeInfo>();
opByCode.set(0x00, {name: 'stop', arity: 0});
opByCode.set(0x01, {name: 'add', arity: 2});
opByCode.set(0x02, {name: 'mul', arity: 2});
opByCode.set(0x03, {name: 'sub', arity: 2});
opByCode.set(0x04, {name: 'div', arity: 2});
opByCode.set(0x05, {name: 'sdiv', arity: 2});
opByCode.set(0x06, {name: 'mod', arity: 2});
opByCode.set(0x07, {name: 'smod', arity: 2});
opByCode.set(0x08, {name: 'addmod', arity: 3});
opByCode.set(0x09, {name: 'mulmod', arity: 3});
opByCode.set(0x0a, {name: 'exp', arity: 2});
opByCode.set(0x0b, {name: 'signextend', arity: 2});

opByCode.set(0x10, {name: 'lt', arity: 2});
opByCode.set(0x11, {name: 'gt', arity: 2});
opByCode.set(0x12, {name: 'slt', arity: 2});
opByCode.set(0x13, {name: 'sgt', arity: 2});
opByCode.set(0x14, {name: 'eq', arity: 2});
opByCode.set(0x15, {name: 'iszero', arity: 1});
opByCode.set(0x16, {name: 'and', arity: 2});
opByCode.set(0x17, {name: 'or', arity: 2});
opByCode.set(0x18, {name: 'xor', arity: 2});
opByCode.set(0x19, {name: 'not', arity: 1});
opByCode.set(0x1a, {name: 'byte', arity: 2});
opByCode.set(0x1b, {name: 'shl', arity: 2});
opByCode.set(0x1c, {name: 'shr', arity: 2});
opByCode.set(0x1d, {name: 'sar', arity: 2});

opByCode.set(0x20, {name: 'keccak256', arity: 2});

opByCode.set(0x30, {name: 'getAddress', arity: 0});
opByCode.set(0x31, {name: 'getExternalBalance', arity: 1});
opByCode.set(0x32, {name: 'getTxOrigin', arity: 0});
opByCode.set(0x33, {name: 'getCaller', arity: 0});
opByCode.set(0x34, {name: 'getCallValue', arity: 0});
opByCode.set(0x35, {name: 'callDataLoad', arity: 1});
opByCode.set(0x36, {name: 'getCallDataSize', arity: 0});
opByCode.set(0x37, {name: 'callDataCopy', arity: 3});
opByCode.set(0x38, {name: 'getCodeSize', arity: 0});
opByCode.set(0x39, {name: 'codeCopy', arity: 3});
opByCode.set(0x3a, {name: 'getTxGasPrice', arity: 0});
opByCode.set(0x3b, {name: 'getExternalCodeSize', arity: 1});
opByCode.set(0x3c, {name: 'externalCodeCopy', arity: 4});
opByCode.set(0x3d, {name: 'getReturnDataSize', arity: 0});
opByCode.set(0x3e, {name: 'returnDataCopy', arity: 3});
opByCode.set(0x3f, {name: 'getExternalCodeHash', arity: 1});

opByCode.set(0x40, {name: 'getBlockHash', arity: 1});
opByCode.set(0x41, {name: 'getBlockCoinbase', arity: 0});
opByCode.set(0x42, {name: 'getBlockTimestamp', arity: 0});
opByCode.set(0x43, {name: 'getBlockNumber', arity: 0});
opByCode.set(0x44, {name: 'getBlockDifficulty', arity: 0});
opByCode.set(0x45, {name: 'getBlockGasLimit', arity: 0});
opByCode.set(0x46, {name: 'getBlockChainId', arity: 0});
opByCode.set(0x47, {name: 'getSelfBalance', arity: 0});

opByCode.set(0x50, {name: 'pop', arity: 0});
opByCode.set(0x51, {name: 'loadMemory', arity: 1});
opByCode.set(0x52, {name: 'storeMemory', arity: 2});
opByCode.set(0x53, {name: 'storeMemory8', arity: 2});
opByCode.set(0x54, {name: 'storageLoad', arity: 1});
opByCode.set(0x55, {name: 'storageStore', arity: 2});
opByCode.set(0x56, {name: 'jump', arity: 1});
opByCode.set(0x57, {name: 'jumpi', arity: 2});
opByCode.set(0x58, {name: 'pc', arity: 0});
opByCode.set(0x59, {name: 'getMSize', arity: 0});
opByCode.set(0x5a, {name: 'getGasLeft', arity: 0});
opByCode.set(0x5b, {name: 'jumpdest', arity: 0});

opByCode.set(0xa0, {name: 'log0', arity: 2});
opByCode.set(0xa1, {name: 'log1', arity: 3});
opByCode.set(0xa2, {name: 'log2', arity: 4});
opByCode.set(0xa3, {name: 'log3', arity: 5});
opByCode.set(0xa4, {name: 'log4', arity: 6});

opByCode.set(0xf0, {name: 'create', arity: 3});
opByCode.set(0xf1, {name: 'call', arity: 7});
opByCode.set(0xf2, {name: 'callCode', arity: 7});
opByCode.set(0xf3, {name: 'finish', arity: 2});
opByCode.set(0xf4, {name: 'callDelegate', arity: 6});
opByCode.set(0xf5, {name: 'create2', arity: 3});
opByCode.set(0xfa, {name: 'callStatic', arity: 6});
opByCode.set(0xfd, {name: 'revert', arity: 2});
opByCode.set(0xfe, {name: 'invalid', arity: 0});
opByCode.set(0xff, {name: 'selfDestruct', arity: 1});

// export enum OpcodeNameToCode {
//     stop = 0x00,
//     add = 0x01,
//     mul = 0x02,
//     sub = 0x03,
//     div = 0x04,
//     sdiv = 0x05,
//     mod = 0x06,
//     smod = 0x07,
//     addmod = 0x08,
//     mulmod = 0x09,
//     exp = 0x0a,
//     signextend = 0x0b,

//     lt = 0x10,
//     gt = 0x11,
//     slt = 0x12,
//     sgt = 0x13,
//     eq = 0x14,
//     iszero = 0x15,
//     and = 0x16,
//     or = 0x17,
//     xor = 0x18,
//     not = 0x19,
//     byte = 0x1a,
//     shl = 0x1b,
//     shr = 0x1c,
//     sar = 0x1d,

//     keccak256 = 0x20,

//     getAddress = 0x30,
//     getExternalBalance = 0x31,
//     getTxOrigin = 0x32,
//     getCaller = 0x33,
//     getCallValue = 0x34,
//     callDataLoad = 0x35,
//     getCallDataSize = 0x36,
//     callDataCopy = 0x37,
//     getCodeSize = 0x38,
//     codeCopy = 0x39,
//     getTxGasPrice = 0x3a,
//     getExternalCodeSize = 0x3b,
//     externalCodeCopy = 0x3c,
//     getReturnDataSize = 0x3d,
//     returnDataCopy = 0x3e,
//     getExternalCodeHash = 0x3f,

//     getBlockHash = 0x40,
//     getBlockCoinbase = 0x41,
//     getBlockTimestamp = 0x42,
//     getBlockNumber = 0x43,
//     getBlockDifficulty = 0x44,
//     getBlockGasLimit = 0x45,
//     getBlockChainId = 0x46,
//     getSelfBalance = 0x47,

//     pop = 0x50,
//     loadMemory = 0x51,
//     storeMemory = 0x52,
//     storeMemory8 = 0x53,
//     storageLoad = 0x54,
//     storageStore = 0x55,
//     jump = 0x56,
//     jumpi = 0x57,
//     pc = 0x58,
//     getMSize = 0x59,
//     getGasLeft = 0x5a,
//     jumpdest = 0x5b,

//     log0 = 0xa0,
//     log1 = 0xa1,
//     log2 = 0xa2,
//     log3 = 0xa3,
//     log4 = 0xa4,

//     create = 0xf0,
//     call = 0xf1,
//     callCode = 0xf2,
//     return = 0xf3,
//     callDelegate = 0xf4,
//     create2 = 0xf5,
//     callStatic = 0xfa,
//     revert = 0xfd,
//     invalid = 0xfe,
//     selfDestruct = 0xff,
// }
