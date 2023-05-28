import { BigInt } from "./bn";
import { Context } from './context';
import { u8ArrayToArrayBuffer, u8ArrayToBigInt, bigIntToU8Array32 } from './utils';
import * as wasmx from './wasmx';
import * as evm from './evm';
import { Memory } from './memory';

type OpcodeFn = (ctx: Context, inputs: BigInt[]) => void;

export const opcodesMap = new Map<string,OpcodeFn>();
opcodesMap.set('finish', finish);
opcodesMap.set('stop', stop);
opcodesMap.set('revert', revert);
// opcodesMap.set('invalid', invalid); // TODO

opcodesMap.set('jump', jump);
opcodesMap.set('jumpi', jumpi);
opcodesMap.set('jumpdest', jumpdest);
opcodesMap.set('pop', pop);
opcodesMap.set('push0', pop);
// opcodesMap.set('getMSize', getMSize); // TODO

opcodesMap.set('loadMemory', loadMemory);
opcodesMap.set('storeMemory', storeMemory);
opcodesMap.set('storeMemory8', storeMemory8);
opcodesMap.set('storageLoad', storageLoad);
opcodesMap.set('storageStore', storageStore);

opcodesMap.set('add', add);
opcodesMap.set('mul', mul);
opcodesMap.set('sub', sub);
opcodesMap.set('div', div);
opcodesMap.set('sdiv', sdiv);
opcodesMap.set('mod', mod);
opcodesMap.set('smod', smod);
opcodesMap.set('addmod', addmod);
opcodesMap.set('mulmod', mulmod);
opcodesMap.set('exp', exp);
opcodesMap.set('signextend', signextend);
opcodesMap.set('lt', lt);
opcodesMap.set('gt', gt);
opcodesMap.set('slt', slt);
opcodesMap.set('sgt', sgt);
opcodesMap.set('eq', eq);
opcodesMap.set('iszero', iszero);
opcodesMap.set('and', and);
opcodesMap.set('or', or);
opcodesMap.set('xor', xor);
opcodesMap.set('not', not);
opcodesMap.set('byte', byte);
opcodesMap.set('shl', shl);
opcodesMap.set('shr', shr);
opcodesMap.set('sar', sar);
opcodesMap.set('keccak256', keccak256);

opcodesMap.set('getAddress', getAddress);
opcodesMap.set('getExternalBalance', getExternalBalance);
opcodesMap.set('getTxOrigin', getTxOrigin);
opcodesMap.set('getCaller', getCaller);
opcodesMap.set('getCallValue', getCallValue);
opcodesMap.set('callDataLoad', callDataLoad);
opcodesMap.set('getCallDataSize', getCallDataSize);
opcodesMap.set('callDataCopy', callDataCopy);
opcodesMap.set('getCodeSize', getCodeSize);
opcodesMap.set('codeCopy', codeCopy);
opcodesMap.set('getTxGasPrice', getTxGasPrice);
opcodesMap.set('getExternalCodeSize', getExternalCodeSize);
opcodesMap.set('externalCodeCopy', externalCodeCopy);
opcodesMap.set('getReturnDataSize', getReturnDataSize);
opcodesMap.set('returnDataCopy', returnDataCopy);
opcodesMap.set('getExternalCodeHash', getExternalCodeHash);
opcodesMap.set('getBlockHash', getBlockHash);
opcodesMap.set('getBlockCoinbase', getBlockCoinbase);
opcodesMap.set('getBlockTimestamp', getBlockTimestamp);
opcodesMap.set('getBlockNumber', getBlockNumber);
opcodesMap.set('getBlockDifficulty', getBlockDifficulty);
opcodesMap.set('getBlockGasLimit', getBlockGasLimit);
opcodesMap.set('getBlockChainId', getBlockChainId);
opcodesMap.set('getSelfBalance', getSelfBalance);
opcodesMap.set('getBaseFee', getBaseFee);
opcodesMap.set('getGasLeft', getGasLeft);

opcodesMap.set('log0', log0);
opcodesMap.set('log1', log1);
opcodesMap.set('log2', log2);
opcodesMap.set('log3', log3);
opcodesMap.set('log4', log4);

opcodesMap.set('call', call);
opcodesMap.set('callCode', callCode);
opcodesMap.set('callDelegate', callDelegate);
opcodesMap.set('callStatic', callStatic);
opcodesMap.set('create', create);
opcodesMap.set('create2', create2);
// opcodesMap.set('selfDestruct', selfDestruct);

export function loadMemory (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('mload');
    const offset = inputs[0].toUInt32();
    const result = ctx.memory.load(offset, 32)
    ctx.stack.push(u8ArrayToBigInt(result));
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MLOAD', [bigIntToU8Array32(inputs[0])], [result], ctx.pc);
    }
}

export function storeMemory (ctx: Context, inputs: BigInt[]): void {
    // TODO gas cost for memory
    const offset = inputs[0].toUInt32();
    const value = bigIntToU8Array32(inputs[1]);
    ctx.memory.store(value, offset)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MSTORE', [bigIntToU8Array32(inputs[0])], [bigIntToU8Array32(inputs[1])], ctx.pc);
    }
}

export function storeMemory8 (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('mstore8');
    const offset = inputs[0].toUInt32();
    const value = bigIntToU8Array32(inputs[1]);

    ctx.memory.store(value, offset)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MSTORE8', [bigIntToU8Array32(inputs[0])], [bigIntToU8Array32(inputs[1])], ctx.pc);
    }
}

export function getAddress (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('address');
    const address = ctx.env.contract.address
    ctx.stack.push(address);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('ADDRESS', [], [bigIntToU8Array32(address)], ctx.pc);
    }
}

export function getSelfBalance (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('selfbalance');
    const value = evm.balance(ctx.env.contract.address);
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SELFBALANCE', [], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function getExternalBalance (ctx: Context, inputs: BigInt[]): void {
    // TODO charge less for cached results
    ctx.gasmeter.useOpcodeGas('balance');
    const address = inputs[0];
    const balance = evm.balance(address);
    ctx.stack.push(balance);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('BALANCE', [bigIntToU8Array32(address)], [bigIntToU8Array32(balance)], ctx.pc);
    }
}

export function getBaseFee(ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('basefee');
    const value = BigInt.from(0);
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('BASEFEE', [], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function getBlockHash (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('blockhash');
    const number = inputs[0];
    const hash = evm.blockhash(number);
    ctx.stack.push(hash);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('BLOCKHASH', [bigIntToU8Array32(number)], [bigIntToU8Array32(hash)], ctx.pc);
    }
}

export function callDataCopy (ctx: Context, inputs: BigInt[]): void {
    // TODO charge for memory used
    ctx.gasmeter.useOpcodeGas('calldatacopy');
    const resultOffset = inputs[0].toUInt32()
    const dataOffset = inputs[1].toUInt32()
    const length = inputs[2].toUInt32()
    const data = Memory.load(ctx.env.currentCall.callData, dataOffset, length);
    ctx.memory.store(data, resultOffset)

    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLDATACOPY', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1]), bigIntToU8Array32(inputs[2])], [data], ctx.pc);
    }
}

export function getCallDataSize (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('calldatasize');
    const value = BigInt.fromInt32(ctx.env.currentCall.callData.length);
    ctx.stack.push(value)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLDATASIZE', [bigIntToU8Array32(value)], [], ctx.pc);
    }
}

export function callDataLoad (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('calldataload');
    const dataOffset = inputs[0].toUInt32()
    const value =  Memory.load(ctx.env.currentCall.callData, dataOffset, 32);

    ctx.stack.push(u8ArrayToBigInt(value));
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLDATALOAD', [bigIntToU8Array32(inputs[0])], [value], ctx.pc);
    }
}

export function storageStore (ctx: Context, inputs: BigInt[]): void {
    // TODO charge less for cached value
    ctx.gasmeter.useOpcodeGas('sstore');
    evm.sstore(inputs[0], inputs[1]);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SSTORE', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [], ctx.pc);
    }
}

export function storageLoad (ctx: Context, inputs: BigInt[]): void {
    // TODO charge less for cached value
    ctx.gasmeter.useOpcodeGas('sload');
    const value = evm.sload(inputs[0]);
    ctx.stack.push(value)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SLOAD', [bigIntToU8Array32(inputs[0])], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function getCaller (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('caller');
    const address = ctx.env.currentCall.sender;
    ctx.stack.push(address);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLER', [], [bigIntToU8Array32(address)], ctx.pc);
    }
}

export function getCallValue (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('callvalue');
    const value = ctx.env.currentCall.funds;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLVALUE', [], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function getCodeSize (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('codesize');
    const value = BigInt.fromInt32(ctx.env.contract.bytecode.length);
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CODESIZE', [], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function codeCopy (ctx: Context, inputs: BigInt[]): void {
    // TODO charge for memory used
    ctx.gasmeter.useOpcodeGas('calldatacopy');
    const resultOffset = inputs[0].toUInt32()
    const codeOffset = inputs[1].toUInt32()
    const length = inputs[2].toUInt32()
    const data = Memory.load(ctx.env.contract.bytecode, codeOffset, length);
    ctx.memory.store(data, resultOffset)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CODECOPY', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1]), bigIntToU8Array32(inputs[2])], [data], ctx.pc);
    }
}

export function getBlockCoinbase (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('coinbase');
    const address = ctx.env.block.proposer
    ctx.stack.push(address);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('COINBASE', [], [bigIntToU8Array32(address)], ctx.pc);
    }
}

export function getBlockDifficulty (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('difficulty');
    const value = ctx.env.block.difficulty;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('DIFFICULTY', [], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function getExternalCodeSize (ctx: Context, inputs: BigInt[]): void {
    // TODO charge less for cached results
    ctx.gasmeter.useOpcodeGas('extcodesize');
    const address = inputs[0];
    const size = evm.extcodesize(ctx, address);
    ctx.stack.push(size);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('EXTCODESIZE', [bigIntToU8Array32(address)], [bigIntToU8Array32(size)], ctx.pc);
    }
}

export function getExternalCodeHash (ctx: Context, inputs: BigInt[]): void {
    // TODO charge less for cached results
    ctx.gasmeter.useOpcodeGas('extcodehash');
    const address = inputs[0];
    const size = evm.extcodehash(ctx, address);
    ctx.stack.push(size);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('EXTCODEHASH', [bigIntToU8Array32(address)], [bigIntToU8Array32(size)], ctx.pc);
    }
}

export function externalCodeCopy (ctx: Context, inputs: BigInt[]): void {
    // TODO charge for memory used, less for cached account
    ctx.gasmeter.useOpcodeGas('extcodecopy');
    const resultOffset = inputs[1].toUInt32()
    const codeOffset = inputs[2].toUInt32()
    const length = inputs[3].toUInt32()
    const code = evm.getExternalCode(ctx, inputs[0]);
    const data = Memory.load(code, codeOffset, length);
    ctx.memory.store(data, resultOffset)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('EXTCODECOPY', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1]), bigIntToU8Array32(inputs[2]), bigIntToU8Array32(inputs[3])], [], ctx.pc);
    }
}

export function getGasLeft (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('gas');
    const value = ctx.gasmeter.getGasLeft()
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('GAS', [bigIntToU8Array32(value)], [], ctx.pc);
    }
}

export function getBlockGasLimit (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('gaslimit');
    const value = ctx.env.block.gasLimit
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('GASLIMIT',[], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function getTxGasPrice (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('gasprice');
    const value = ctx.env.transaction.gasPrice;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('GASPRICE',[], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function getBlockNumber (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('number');
    const value = ctx.env.block.height;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('NUMBER',[], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function getBlockTimestamp (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('timestamp');
    const value = ctx.env.block.timestamp;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('TIMESTAMP',[], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function getTxOrigin (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('origin');
    const value = ctx.env.currentCall.origin;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('ORIGIN',[], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function getReturnDataSize (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('returndatasize');
    const value = BigInt.fromInt32(ctx.env.currentCall.returnData.length);
    ctx.stack.push(value)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('RETURNDATASIZE', [bigIntToU8Array32(value)], [], ctx.pc);
    }
}

export function getBlockChainId (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('chainid');
    const value = ctx.env.chain.chainId
    ctx.stack.push(value)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CHAINID', [bigIntToU8Array32(value)], [], ctx.pc);
    }
}

export function returnDataCopy (ctx: Context, inputs: BigInt[]): void {
    // TODO charge for memory used
    ctx.gasmeter.useOpcodeGas('returndatacopy');
    const resultOffset = inputs[0].toUInt32()
    const dataOffset = inputs[1].toUInt32()
    const length = inputs[2].toUInt32()
    const data = Memory.load(ctx.env.currentCall.returnData, dataOffset, length);
    ctx.memory.store(data, resultOffset)

    if (ctx.logger.isDebug) {
        ctx.logger.debug('RETURNDATACOPY', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1]), bigIntToU8Array32(inputs[2])], [data], ctx.pc);
    }
}

export function log (ctx: Context, dataOffset: u32, dataLength: u32, topics: BigInt[]): void {
    // TODO price based on topics indexed
    ctx.gasmeter.useOpcodeGas('log');
    const data = ctx.memory.load(dataOffset, dataLength);
    evm.log(data, topics);
    if (ctx.logger.isDebug) {
        const inputs: u8[][] = [data].concat(topics.reduce((accum: u8[][], value: BigInt) => accum.concat([bigIntToU8Array32(value)]), []));
        ctx.logger.debug('LOG', inputs, [], ctx.pc);
    }
}

export function log0 (ctx: Context, inputs: BigInt[]): void {
    const dataOffset = inputs[0].toUInt32();
    const dataLength = inputs[1].toUInt32();
    return log(ctx, dataOffset, dataLength, []);
}

export function log1 (ctx: Context, inputs: BigInt[]): void {
    const dataOffset = inputs[0].toUInt32();
    const dataLength = inputs[1].toUInt32();
    return log(ctx, dataOffset, dataLength, inputs.slice(2));
}

export function log2  (ctx: Context, inputs: BigInt[]): void {
    const dataOffset = inputs[0].toUInt32();
    const dataLength = inputs[1].toUInt32();
    return log(ctx, dataOffset, dataLength, inputs.slice(2));
}

export function log3  (ctx: Context, inputs: BigInt[]): void {
    const dataOffset = inputs[0].toUInt32();
    const dataLength = inputs[1].toUInt32();
    return log(ctx, dataOffset, dataLength, inputs.slice(2));
}

export function log4  (ctx: Context, inputs: BigInt[]): void {
    const dataOffset = inputs[0].toUInt32();
    const dataLength = inputs[1].toUInt32();
    return log(ctx, dataOffset, dataLength, inputs.slice(2));
}

export function finish (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('return');
    const dataOffset = inputs[0];
    const dataLength = inputs[1];
    const result = ctx.memory.load(dataOffset.toUInt32(), dataLength.toUInt32());
    ctx.pc = 0;
    ctx.env.currentCall.returnData = result;
    ctx.env.currentCall.returnDataSuccess = 0;
    if (ctx.logger.isDebug) {
        ctx.logger.debug('RETURN', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [result], ctx.pc);
    }
    wasmx.finish(u8ArrayToArrayBuffer(result));
}

export function stop (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('return');
    ctx.pc = 0;
    ctx.env.currentCall.returnData = [];
    ctx.env.currentCall.returnDataSuccess = 0;
    if (ctx.logger.isDebug) {
        ctx.logger.debug('STOP', [], [], ctx.pc);
    }
    wasmx.finish(new ArrayBuffer(0));
}

// Returns 0 on success, 1 on failure and 2 on revert
export function revert (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('revert');
    const dataOffset = inputs[0];
    const dataLength = inputs[1];
    const result = ctx.memory.load(dataOffset.toUInt32(), dataLength.toUInt32());
    ctx.pc = 0;
    ctx.env.currentCall.returnData = result;
    ctx.env.currentCall.returnDataSuccess = 2;
    if (ctx.logger.isDebug) {
        ctx.logger.debug('REVERT', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [result], ctx.pc);
    }
    wasmx.revert(u8ArrayToArrayBuffer(result));
}

export function push0(ctx: Context, code: u8): void {
    ctx.gasmeter.useOpcodeGas('push0');
    const value = BigInt.fromInt32(0);
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('PUSH0', [], [bigIntToU8Array32(value)], ctx.pc);
    }
}

export function handlePush (ctx: Context, code: u8): void {
    ctx.gasmeter.useOpcodeGas('push');
    const no = code - 0x60 + 1;
    const _value = new Array<u8>(32 - no).concat(Memory.load(ctx.bytecode, ctx.pc, no))
    const value = u8ArrayToBigInt(_value);
    ctx.stack.push(value);
    ctx.pc += no;
    if (ctx.logger.isDebug) {
        ctx.logger.debug(`PUSH${no}`, [_value], [], ctx.pc);
    }
}

export function handleSwap (ctx: Context, code: u8): void {
    ctx.gasmeter.useOpcodeGas('swap');
    const no = code - 0x90 + 1;
    ctx.stack.swap(no);
    if (ctx.logger.isDebug) {
        ctx.logger.debug(`SWAP${no}`, [], [], ctx.pc);
    }
}

export function handleDup (ctx: Context, code: u8): void {
    ctx.gasmeter.useOpcodeGas('dup');
    const no = code - 0x80 + 1;
    const value = ctx.stack.dup(no);
    if (ctx.logger.isDebug) {
        ctx.logger.debug(`DUP${no}`, [bigIntToU8Array32(value)], [], ctx.pc);
    }
}

export function jump (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('jump');
    const newpos = inputs[0].toInt32();
    if (!newpos && newpos !== 0) {
        throw new Error(`Invalid JUMP ${newpos}`);
    }
    ctx.pc = newpos;
    if (ctx.logger.isDebug) {
        ctx.logger.debug('JUMP', [bigIntToU8Array32(inputs[0])], [], ctx.pc);
    }
}

export function jumpi (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('jumpi');
    const newpos = inputs[0].toInt32();
    // EVM allows any uint256 except from 0 to be interpreted as true
    const condition = inputs[1].toInt32() > 0;
    if (condition) ctx.pc = newpos;
    if (ctx.logger.isDebug) {
        ctx.logger.debug('JUMPI', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [], ctx.pc);
    }
}

export function jumpdest (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('jumpdest');
    if (ctx.logger.isDebug) {
        ctx.logger.debug('JUMPDEST', [], [], ctx.pc);
    }
}

export function pop (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('pop');
    ctx.stack.pop();
    if (ctx.logger.isDebug) {
        ctx.logger.debug('POP', [], [], ctx.pc);
    }
}

export function add (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('add');
    const result = evm.add(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('ADD', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function sub (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('sub');
    const result = evm.sub(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SUB', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function mul (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('mul');
    const result = evm.mul(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MUL', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

// TODO
export function div (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('div');
    const result = evm.div(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('DIV', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

// TODO
export function sdiv (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('sdiv');

    // const _a = a.fromTwos(256);
    // const _b = b.fromTwos(256);
    // if (_b.isZero()) result = toBN(0);
    // else result = _a.div(_b);
    const result = evm.sdiv(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SDIV', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

// TODO
export function mod (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('mod');
    // const result = a.abs().mod(b.abs());
    const result = evm.mod(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MOD', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

// TODO
export function smod (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('smod');
    //     const _a = a.fromTwos(256);
    //     const _b = b.fromTwos(256);
    //     if (_b.isZero()) result = toBN(0);
    //     else result = _a.mod(_b);
    const result = evm.smod(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SMOD', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

// TODO
export function addmod (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('addmod');
    const result = evm.addmod(inputs[0], inputs[1], inputs[2]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('ADDMOD', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1]), bigIntToU8Array32(inputs[2])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

// TODO
export function mulmod (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('mulmod');
    const result = evm.mulmod(inputs[0], inputs[1], inputs[2]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MULMOD', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1]), bigIntToU8Array32(inputs[2])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

// TODO
export function exp (ctx: Context, inputs: BigInt[]): void {
    // TODO gas cost based on exp
    ctx.gasmeter.useOpcodeGas('exp');
    const result = evm.exp(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('EXP', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

// TODO
export function signextend (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('signextend');
    const result = evm.signextend(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SIGNEXTEND', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function lt (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('lt');
    const result = evm.lt(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('LT', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function gt (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('gt');
    const result = evm.gt(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('GT', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

// TODO
export function slt (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('slt');
//     const _a = a.fromTwos(256);
//     const _b = b.fromTwos(256);
//     let result = _a.lt(_b);
//     result = toBN(result ? 1 : 0);
    const result = evm.slt(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SLT', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

// TODO
export function sgt (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('sgt');
//     const _a = a.fromTwos(256);
//     const _b = b.fromTwos(256);
//     let result = _a.gt(_b);
//     result = toBN(result ? 1 : 0);
    const result = evm.sgt(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SGT', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function eq (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('eq');
    const result = evm.eq(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('EQ', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function iszero (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('iszero');
    const result = evm.iszero(inputs[0]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('ISZERO', [bigIntToU8Array32(inputs[0])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function and (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('and');
    const result = evm.and(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('AND', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function or (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('or');
    const result = evm.or(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('OR', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function xor (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('xor');
    const result = evm.xor(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('XOR', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function not (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('not');
    const result = evm.not(inputs[0]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('NOT', [bigIntToU8Array32(inputs[0])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function byte (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('byte');
    const result = evm.byte(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('BYTE', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function shl (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('shl');
    const result = evm.shl(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SHL', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function shr (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('shr');
    const result = evm.shr(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SHR', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function sar (ctx: Context, inputs: BigInt[]): void {
    ctx.gasmeter.useOpcodeGas('sar');
    const result = evm.sar(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SAR', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function keccak256 (ctx: Context, inputs: BigInt[]): void {
    // TODO gas units based on data slots
    ctx.gasmeter.useOpcodeGas('keccak256');
    const data = ctx.memory.load(inputs[0].toUInt32(), inputs[1].toUInt32());
    const result = evm.keccak256(data);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('KECCAK256', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1])], [bigIntToU8Array32(result)], ctx.pc);
    }
}

export function call (ctx: Context, inputs: BigInt[]): void {
    // TODO gas
    ctx.gasmeter.useOpcodeGas('call');
    const inptr = inputs[3].toUInt32();
    const insize = inputs[4].toUInt32();
    const outptr = inputs[5].toUInt32();
    const outsize = inputs[6].toUInt32();
    const calldata = ctx.memory.load(inptr, insize);
    const result = evm.call(ctx, inputs[0], inputs[1], inputs[2], calldata);

    // 0 = success, 1 = revert; 2 = internal error;
    ctx.env.currentCall.returnDataSuccess = result.success == 0 ? 1 : 0;
    ctx.env.currentCall.returnData = result.data;

    const data = result.data.slice(0, outsize);
    const success = BigInt.from(ctx.env.currentCall.returnDataSuccess);
    ctx.memory.store(data, outptr);
    ctx.stack.push(success);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALL', [
            bigIntToU8Array32(inputs[0]),
            bigIntToU8Array32(inputs[1]),
            bigIntToU8Array32(inputs[2]),
            bigIntToU8Array32(inputs[3]),
            bigIntToU8Array32(inputs[4]),
            bigIntToU8Array32(inputs[5]),
            bigIntToU8Array32(inputs[6]),
        ], [bigIntToU8Array32(success), data], ctx.pc);
    }
}

export function callCode (ctx: Context, inputs: BigInt[]): void {
    // TODO gas
    ctx.gasmeter.useOpcodeGas('callcode');
    const inptr = inputs[3].toUInt32();
    const insize = inputs[4].toUInt32();
    const outptr = inputs[5].toUInt32();
    const outsize = inputs[6].toUInt32();
    const calldata = ctx.memory.load(inptr, insize);
    const result = evm.callCode(ctx, inputs[0], inputs[1], inputs[2], calldata);

    // 0 = success, 1 = revert; 2 = internal error;
    ctx.env.currentCall.returnDataSuccess = result.success == 0 ? 1 : 0;
    ctx.env.currentCall.returnData = result.data;

    const data = result.data.slice(0, outsize);
    const success = BigInt.from(ctx.env.currentCall.returnDataSuccess);
    ctx.memory.store(data, outptr);
    ctx.stack.push(success);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLCODE', [
            bigIntToU8Array32(inputs[0]),
            bigIntToU8Array32(inputs[1]),
            bigIntToU8Array32(inputs[2]),
            bigIntToU8Array32(inputs[3]),
            bigIntToU8Array32(inputs[4]),
            bigIntToU8Array32(inputs[5]),
            bigIntToU8Array32(inputs[6]),
        ], [bigIntToU8Array32(success), data], ctx.pc);
    }
}

export function callDelegate (ctx: Context, inputs: BigInt[]): void {
    // TODO gas
    ctx.gasmeter.useOpcodeGas('call');
    const inptr = inputs[2].toUInt32();
    const insize = inputs[3].toUInt32();
    const outptr = inputs[4].toUInt32();
    const outsize = inputs[5].toUInt32();
    const calldata = ctx.memory.load(inptr, insize);
    const result = evm.callDelegate(ctx, inputs[0], inputs[1], calldata);

    // 0 = success, 1 = revert; 2 = internal error;
    ctx.env.currentCall.returnDataSuccess = result.success == 0 ? 1 : 0;
    ctx.env.currentCall.returnData = result.data;

    const data = result.data.slice(0, outsize);
    const success = BigInt.from(ctx.env.currentCall.returnDataSuccess);
    ctx.memory.store(data, outptr);
    ctx.stack.push(success);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('DELEGATECALL', [
            bigIntToU8Array32(inputs[0]),
            bigIntToU8Array32(inputs[1]),
            bigIntToU8Array32(inputs[2]),
            bigIntToU8Array32(inputs[3]),
            bigIntToU8Array32(inputs[4]),
            bigIntToU8Array32(inputs[5]),
        ], [bigIntToU8Array32(success), data], ctx.pc);
    }
}

export function callStatic (ctx: Context, inputs: BigInt[]): void {
    // TODO gas
    ctx.gasmeter.useOpcodeGas('callstatic');
    const inptr = inputs[2].toUInt32();
    const insize = inputs[3].toUInt32();
    const outptr = inputs[4].toUInt32();
    const outsize = inputs[5].toUInt32();
    const calldata = ctx.memory.load(inptr, insize);
    const result = evm.callStatic(ctx, inputs[0], inputs[1], calldata);

    // 0 = success, 1 = revert; 2 = internal error;
    ctx.env.currentCall.returnDataSuccess = result.success == 0 ? 1 : 0;
    ctx.env.currentCall.returnData = result.data;

    const data = result.data.slice(0, outsize);
    const success = BigInt.from(ctx.env.currentCall.returnDataSuccess);
    ctx.memory.store(data, outptr);
    ctx.stack.push(success);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('STATICCALL', [
            bigIntToU8Array32(inputs[0]),
            bigIntToU8Array32(inputs[1]),
            bigIntToU8Array32(inputs[2]),
            bigIntToU8Array32(inputs[3]),
            bigIntToU8Array32(inputs[4]),
            bigIntToU8Array32(inputs[5]),
        ], [bigIntToU8Array32(success), data], ctx.pc);
    }
}

export function create (ctx: Context, inputs: BigInt[]): void {
    // todo gas
    ctx.gasmeter.useOpcodeGas('create');
    const data = ctx.memory.load(inputs[1].toUInt32(), inputs[2].toUInt32());
    const address = evm.create(inputs[0], data);
    ctx.stack.push(address);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CREATE', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1]), bigIntToU8Array32(inputs[2])], [bigIntToU8Array32(address)], ctx.pc);
    }
}

export function create2 (ctx: Context, inputs: BigInt[]): void {
    // todo gas
    ctx.gasmeter.useOpcodeGas('create2');
    const data = ctx.memory.load(inputs[1].toUInt32(), inputs[2].toUInt32());
    const address = evm.create2(inputs[0], data, inputs[3]);
    ctx.stack.push(address);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CREATE2', [bigIntToU8Array32(inputs[0]), bigIntToU8Array32(inputs[1]), bigIntToU8Array32(inputs[2]), bigIntToU8Array32(inputs[3])], [bigIntToU8Array32(address)], ctx.pc);
    }
}

// export function selfDestruct (address, ctx: Context, inputs: BigInt[]): void {
//     const gasCost = getPrice('selfdestruct');
//     jsvm_env.useGas(gasCost);
//     jsvm_env.selfDestruct(BN2uint8arr(address));
//     logger.debug('SELFDESTRUCT', [address], [], getCache(), ctx.stack, undefined, position, gasCost);
//     finishAction({gas: jsvm_env.getGas(), context: jsvm_env.getContext(), logs: jsvm_env.getLogs()});
//     return {ctx.stack, position: 0};
// }
