import { u256 } from 'as-bignum/assembly';
import { Context } from './context';
import { u8ArrayToArrayBuffer } from './utils';
import * as ERROR from './error';
import * as wasmx from './wasmx';
import * as evm from './evm';
import { EvmLog } from './types';
import { Memory } from './memory';

type OpcodeFn = (ctx: Context, inputs: u256[]) => void;

export const opcodesMap = new Map<string,OpcodeFn>();
opcodesMap.set('finish', finish);
opcodesMap.set('stop', stop);
opcodesMap.set('jump', jump);
opcodesMap.set('jumpi', jumpi);
opcodesMap.set('pop', pop);

opcodesMap.set('loadMemory', loadMemory);
opcodesMap.set('storeMemory', storeMemory);


export function loadMemory (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('mload');
    const offset = inputs[0].toI32();
    const result = ctx.memory.load(offset, 32)
    ctx.stack.push(u256.fromBytesBE(result));
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MLOAD', [inputs[0].toBytes(true)], [inputs[1].toBytes(true)], ctx.pc);
    }
}

export function storeMemory (ctx: Context, inputs: u256[]): void {
    // TODO gas cost for memory
    const offset = inputs[0].toI32();
    const value = inputs[1].toBytes(true);
    ctx.memory.store(value, offset)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MSTORE', [inputs[0].toBytes(true)], [inputs[1].toBytes(true)], ctx.pc);
    }
}

export function storeMemory8 (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('mstore8');
    const offset = inputs[0].toI32();
    const value = inputs[1].toBytes(true);

    ctx.memory.store(value, offset)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MSTORE8', [inputs[0].toBytes(true)], [inputs[1].toBytes(true)], ctx.pc);
    }
}

export function getAddress (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('address');
    const address = ctx.env.contract.address
    ctx.stack.push(address);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('ADDRESS', [], [address.toBytes(true)], ctx.pc);
    }
}

export function getExternalBalance (ctx: Context, inputs: u256[]): void {
    // TODO charge less for cached results
    ctx.gasmeter.useOpcodeGas('balance');
    const address = inputs[0];
    const balance = evm.balance(address);
    ctx.stack.push(balance);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('BALANCE', [address.toBytes(true)], [balance.toBytes(true)], ctx.pc);
    }
}

export function getBlockHash (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('blockhash');
    const number = inputs[0];
    const hash = evm.blockhash(number);
    ctx.stack.push(hash);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('BLOCKHASH', [number.toBytes(true)], [hash.toBytes(true)], ctx.pc);
    }
}

export function callDataCopy (ctx: Context, inputs: u256[]): void {
    // TODO charge for memory used
    ctx.gasmeter.useOpcodeGas('calldatacopy');
    const resultOffset = inputs[0].toI64()
    const dataOffset = inputs[1].toI64()
    const length = inputs[2].toI64()
    const data = Memory.load(ctx.env.currentCall.callData, dataOffset, length);
    ctx.memory.store(data, resultOffset)

    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLDATACOPY', [inputs[0].toBytes(true), inputs[1].toBytes(true), inputs[2].toBytes(true)], [data], ctx.pc);
    }
}

export function getCallDataSize (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('calldatasize');
    const value = u256.fromI32(ctx.env.currentCall.callData.length);
    ctx.stack.push(value)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLDATASIZE', [value.toBytes(true)], [], ctx.pc);
    }
}

export function callDataLoad (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('calldataload');
    const dataOffset = inputs[0].toI64()
    const value =  Memory.load(ctx.env.currentCall.callData, dataOffset, 32);

    ctx.stack.push(u256.fromBytesBE(value));
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLDATALOAD', [inputs[0].toBytes(true)], [value], ctx.pc);
    }
}

export function storageStore (ctx: Context, inputs: u256[]): void {
    // TODO charge less for cached value
    ctx.gasmeter.useOpcodeGas('sstore');
    evm.sstore(inputs[0], inputs[1]);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SSTORE', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [], ctx.pc);
    }
}

export function storageLoad (ctx: Context, inputs: u256[]): void {
    // TODO charge less for cached value
    ctx.gasmeter.useOpcodeGas('sload');
    const value = evm.sload(inputs[0]);
    ctx.stack.push(value)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SLOAD', [inputs[0].toBytes(true)], [value.toBytes(true)], ctx.pc);
    }
}

export function getCaller (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('caller');
    const address = ctx.env.currentCall.sender;
    ctx.stack.push(u256.fromBytes(address));
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLER', [], [address.toBytes(true)], ctx.pc);
    }
}

export function getCallValue (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('callvalue');
    const value = ctx.env.currentCall.funds;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CALLVALUE', [], [value.toBytes(true)], ctx.pc);
    }
}

export function getCodeSize (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('codesize');
    const value = u256.fromI32(ctx.env.contract.bytecode.length);
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CODESIZE', [], [value.toBytes(true)], ctx.pc);
    }
}

export function codeCopy (ctx: Context, inputs: u256[]): void {
    // TODO charge for memory used
    ctx.gasmeter.useOpcodeGas('calldatacopy');
    const resultOffset = inputs[0].toI64()
    const codeOffset = inputs[1].toI64()
    const length = inputs[2].toI64()
    const data = Memory.load(ctx.env.contract.bytecode, codeOffset, length);
    ctx.memory.store(data, resultOffset)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CODECOPY', [inputs[0].toBytes(true), inputs[1].toBytes(true), inputs[2].toBytes(true)], [], ctx.pc);
    }
}

export function getBlockCoinbase (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('coinbase');
    const address = ctx.env.block.proposer
    ctx.stack.push(address);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('COINBASE', [], [address.toBytes(true)], ctx.pc);
    }
}

export function getBlockDifficulty (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('difficulty');
    const value = ctx.env.block.difficulty;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('DIFFICULTY', [], [value.toBytes(true)], ctx.pc);
    }
}

export function getExternalCodeSize (ctx: Context, inputs: u256[]): void {
    // TODO charge less for cached results
    ctx.gasmeter.useOpcodeGas('extcodesize');
    const address = inputs[0];
    const size = evm.extcodesize(address);
    ctx.stack.push(size);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('EXTCODESIZE', [address.toBytes(true)], [size.toBytes(true)], ctx.pc);
    }
}

export function getExternalCodeHash (ctx: Context, inputs: u256[]): void {
    // TODO charge less for cached results
    ctx.gasmeter.useOpcodeGas('extcodehash');
    const address = inputs[0];
    const size = evm.extcodehash(address);
    ctx.stack.push(size);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('EXTCODEHASH', [address.toBytes(true)], [size.toBytes(true)], ctx.pc);
    }
}

export function externalCodeCopy (ctx: Context, inputs: u256[]): void {
    // TODO charge for memory used, less for cached account
    ctx.gasmeter.useOpcodeGas('extcodecopy');
    const resultOffset = inputs[1].toI64()
    const codeOffset = inputs[2].toI64()
    const length = inputs[3].toI64()
    const code = evm.getExternalCode(inputs[0]);
    const data = Memory.load(code, codeOffset, length);
    ctx.memory.store(data, resultOffset)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('EXTCODECOPY', [inputs[0].toBytes(true), inputs[1].toBytes(true), inputs[2].toBytes(true), inputs[3].toBytes(true)], [], ctx.pc);
    }
}

export function getGasLeft (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('gas');
    const value = ctx.gasmeter.getGasLeft()
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('GAS', [value.toBytes(true)], [], ctx.pc);
    }
}

export function getBlockGasLimit (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('gaslimit');
    const value = ctx.env.block.gasLimit
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('GASLIMIT',[], [value.toBytes(true)], ctx.pc);
    }
}

export function getTxGasPrice (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('gasprice');
    const value = ctx.env.transaction.gasPrice;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('GASPRICE',[], [value.toBytes(true)], ctx.pc);
    }
}

export function getBlockNumber (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('number');
    const value = ctx.env.block.height;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('NUMBER',[], [value.toBytes(true)], ctx.pc);
    }
}

export function getBlockTimestamp (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('timestamp');
    const value = ctx.env.block.height;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('TIMESTAMP',[], [value.toBytes(true)], ctx.pc);
    }
}

export function getTxOrigin (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('origin');
    const value = ctx.env.currentCall.origin;
    ctx.stack.push(value);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('ORIGIN',[], [value.toBytes(true)], ctx.pc);
    }
}

export function getReturnDataSize (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('returndatasize');
    const value = u256.fromI32(ctx.env.currentCall.returnData.length);
    ctx.stack.push(value)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('RETURNDATASIZE', [value.toBytes(true)], [], ctx.pc);
    }
}

export function getBlockChainId (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('chainid');
    const value = ctx.env.chain.chainId
    ctx.stack.push(value)
    if (ctx.logger.isDebug) {
        ctx.logger.debug('CHAINID', [value.toBytes(true)], [], ctx.pc);
    }
}

export function returnDataCopy (ctx: Context, inputs: u256[]): void {
    // TODO charge for memory used
    ctx.gasmeter.useOpcodeGas('returndatacopy');
    const resultOffset = inputs[0].toI64()
    const dataOffset = inputs[1].toI64()
    const length = inputs[2].toI64()
    const data = Memory.load(ctx.env.currentCall.returnData, dataOffset, length);
    ctx.memory.store(data, resultOffset)

    if (ctx.logger.isDebug) {
        ctx.logger.debug('RETURNDATACOPY', [inputs[0].toBytes(true), inputs[1].toBytes(true), inputs[2].toBytes(true)], [], ctx.pc);
    }
}

export function log (ctx: Context, dataOffset: i64, dataLength: i64, topics: u256[]): void {
    // TODO price based on topics indexed
    ctx.gasmeter.useOpcodeGas('log');
    const data = ctx.memory.load(dataOffset, dataLength);
    const topicsbz = topics.map((v: u256) => {
        return v.toBytes(true);
    });
    ctx.env.currentCall.logs.push(new EvmLog(data, topicsbz))

    if (ctx.logger.isDebug) {
        ctx.logger.debug('LOG', [data, ...topicsbz], [], ctx.pc);
    }
}

export function log0 (ctx: Context, inputs: u256[]): void {
    const dataOffset = inputs[0].toI64();
    const dataLength = inputs[1].toI64();
    return log(ctx, dataOffset, dataLength, []);
}

export function log1 (ctx: Context, inputs: u256[]): void {
    const dataOffset = inputs[0].toI64();
    const dataLength = inputs[1].toI64();
    return log(ctx, dataOffset, dataLength, inputs.slice(2));
}

export function log2  (ctx: Context, inputs: u256[]): void {
    const dataOffset = inputs[0].toI64();
    const dataLength = inputs[1].toI64();
    return log(ctx, dataOffset, dataLength, inputs.slice(2));
}

export function log3  (ctx: Context, inputs: u256[]): void {
    const dataOffset = inputs[0].toI64();
    const dataLength = inputs[1].toI64();
    return log(ctx, dataOffset, dataLength, inputs.slice(2));
}

export function log4  (ctx: Context, inputs: u256[]): void {
    const dataOffset = inputs[0].toI64();
    const dataLength = inputs[1].toI64();
    return log(ctx, dataOffset, dataLength, inputs.slice(2));
}

export function finish (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('return');
    const dataOffset = inputs[0];
    const dataLength = inputs[1];
    const result = ctx.memory.load(dataOffset.toI32(), dataLength.toI32());
    ctx.pc = 0;
    ctx.env.currentCall.returnData = result;
    ctx.env.currentCall.returnDataSuccess = 0;
    wasmx.finish(u8ArrayToArrayBuffer(result));
    if (ctx.logger.isDebug) {
        ctx.logger.debug('RETURN', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result], ctx.pc);
    }
}

export function stop (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('return');
    ctx.pc = 0;
    ctx.env.currentCall.returnData = [];
    ctx.env.currentCall.returnDataSuccess = 0;
    wasmx.finish(new ArrayBuffer(0)); // TODO remove this, its useless
    if (ctx.logger.isDebug) {
        ctx.logger.debug('STOP', [], [], ctx.pc);
    }
}

// Returns 0 on success, 1 on failure and 2 on revert
export function revert (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('revert');
    const dataOffset = inputs[0];
    const dataLength = inputs[1];
    const result = ctx.memory.load(dataOffset.toI32(), dataLength.toI32());
    ctx.pc = 0;
    ctx.env.currentCall.returnData = result;
    ctx.env.currentCall.returnDataSuccess = 2;
    wasmx.finish(u8ArrayToArrayBuffer(result)); // TODO remove
    if (ctx.logger.isDebug) {
        ctx.logger.debug('REVERT', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result], ctx.pc);
    }
}


export function handlePush (ctx: Context, code: u8): void {
    ctx.gasmeter.useOpcodeGas('push');
    const no = code - 0x60 + 1;
    const _value = new Array<u8>(32 - no).concat(Memory.load(ctx.bytecode, ctx.pc, no))
    const value = u256.fromBytesBE(_value);
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
    ctx.stack.dup(no);
    if (ctx.logger.isDebug) {
        ctx.logger.debug(`DUP${no}`, [], [], ctx.pc);
    }
}

export function jump (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('jump');
    const newpos = inputs[0].toI32();
    if (!newpos && newpos !== 0) {
        throw new Error(`Invalid JUMP ${newpos}`);
    }
    ctx.pc = newpos;
    if (ctx.logger.isDebug) {
        ctx.logger.debug('JUMP', [inputs[0].toBytes(true)], [], ctx.pc);
    }
}

export function jumpi (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('jumpi');
    const newpos = inputs[0].toI32();
    // EVM allows any uint256 except from 0 to be interpreted as true
    const condition = inputs[1].toBool();
    if (condition) ctx.pc = newpos;
    if (ctx.logger.isDebug) {
        ctx.logger.debug('JUMPI', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [], ctx.pc);
    }
}

export function jumpdest (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('jumpdest');
    if (ctx.logger.isDebug) {
        ctx.logger.debug('JUMPDEST', [], [], ctx.pc);
    }
}

export function pop (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('pop');
    ctx.stack.pop();
    if (ctx.logger.isDebug) {
        ctx.logger.debug('POP', [], [], ctx.pc);
    }
}

export function add (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('add');
    const result = evm.add(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('ADD', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function sub (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('sub');
    const result = evm.sub(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SUB', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function mul (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('mul');
    const result = evm.mul(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MUL', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

// TODO
export function div (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('div');
    const result = evm.div(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('DIV', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

// TODO
export function sdiv (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('sdiv');

    // const _a = a.fromTwos(256);
    // const _b = b.fromTwos(256);
    // if (_b.isZero()) result = toBN(0);
    // else result = _a.div(_b);
    const result = evm.sdiv(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SDIV', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

// TODO
export function mod (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('mod');
    // const result = a.abs().mod(b.abs());
    const result = evm.mod(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MOD', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

// TODO
export function smod (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('smod');
    //     const _a = a.fromTwos(256);
    //     const _b = b.fromTwos(256);
    //     if (_b.isZero()) result = toBN(0);
    //     else result = _a.mod(_b);
    const result = evm.smod(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SMOD', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

// TODO
export function addmod (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('addmod');
    const result = evm.addmod(inputs[0], inputs[1], inputs[2]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('ADDMOD', [inputs[0].toBytes(true), inputs[1].toBytes(true), inputs[2].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

// TODO
export function mulmod (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('mulmod');
    const result = evm.mulmod(inputs[0], inputs[1], inputs[2]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('MULMOD', [inputs[0].toBytes(true), inputs[1].toBytes(true), inputs[2].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

// TODO
export function exp (ctx: Context, inputs: u256[]): void {
    // TODO gas cost based on exp
    ctx.gasmeter.useOpcodeGas('exp');
    const result = evm.exp(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('EXP', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

// TODO
export function signextend (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('signextend');
    const result = evm.signextend(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SIGNEXTEND', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function lt (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('lt');
    const result = evm.lt(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('LT', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function gt (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('gt');
    const result = evm.gt(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('GT', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

// TODO
export function slt (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('slt');
//     const _a = a.fromTwos(256);
//     const _b = b.fromTwos(256);
//     let result = _a.lt(_b);
//     result = toBN(result ? 1 : 0);
    const result = evm.slt(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SLT', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

// TODO
export function sgt (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('sgt');
//     const _a = a.fromTwos(256);
//     const _b = b.fromTwos(256);
//     let result = _a.gt(_b);
//     result = toBN(result ? 1 : 0);
    const result = evm.sgt(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SGT', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function eq (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('eq');
    const result = evm.eq(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('EQ', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function iszero (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('iszero');
    const result = evm.iszero(inputs[0]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('ISZERO', [inputs[0].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function and (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('and');
    const result = evm.and(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('AND', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function or (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('or');
    const result = evm.or(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('OR', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function xor (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('xor');
    const result = evm.xor(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('XOR', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function not (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('not');
    const result = evm.not(inputs[0]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('NOT', [inputs[0].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function byte (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('byte');
    const result = evm.byte(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('BYTE', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function shl (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('shl');
    const result = evm.shl(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SHL', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function shr (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('shr');
    const result = evm.shr(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SHR', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function sar (ctx: Context, inputs: u256[]): void {
    ctx.gasmeter.useOpcodeGas('sar');
    const result = evm.sar(inputs[0], inputs[1]);
    ctx.stack.push(result);
    if (ctx.logger.isDebug) {
        ctx.logger.debug('SAR', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result.toBytes(true)], ctx.pc);
    }
}

export function keccak256 (ctx: Context, inputs: u256[]): void {
    // TODO gas units based on data slots
    ctx.gasmeter.useOpcodeGas('keccak256');
    const data = ctx.memory.load(inputs[0].toI64(), inputs[1].toI64());
    const result = new Array<u8>(32);

    if (ctx.logger.isDebug) {
        ctx.logger.debug('KECCAK256', [inputs[0].toBytes(true), inputs[1].toBytes(true)], [result], ctx.pc);
    }
}

// // result i32 Returns 0 on success, 1 on failure and 2 on revert
// export function call (ctx: Context, inputs: u256[]): void {
//     gas_limit,
//     address, // the memory offset to load the address from (address)
//     value,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     const {baseFee, addl} = getPrice('call', {value});
//     jsvm_env.useGas(baseFee);
//     jsvm_env.useGas(addl);
//     const result = toBN(jsvm_env.call(
//         gas_limit,
//         BN2uint8arr(address),
//         BN2uint8arr(value),
//         dataOffset,
//         dataLength,
//         outputOffset,
//         outputLength,
//     ));
//     ctx.stack.push(result);
//     logger.debug('CALL', [gas_limit,
//         address,
//         value,
//         dataOffset,
//         dataLength,
//         outputOffset,
//         outputLength,], [result], getCache(), ctx.stack, undefined, position, baseFee, addl);
//     return {ctx.stack, position};
// }

// // result i32 Returns 0 on success, 1 on failure and 2 on revert
// export function callCode (
//     gas_limit,
//     address,
//     value,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position}
// ) {
//     const {baseFee, addl} = getPrice('callcode', {value});
//     jsvm_env.useGas(baseFee);
//     jsvm_env.useGas(addl);
//     const result = toBN(jsvm_env.callCode(
//         gas_limit,
//         BN2uint8arr(address),
//         BN2uint8arr(value),
//         dataOffset,
//         dataLength,
//         outputOffset,
//         outputLength
//     ));
//     ctx.stack.push(result);
//     logger.debug('CALLCODE', [gas_limit_i64, addressOffset_i32ptr_address, valueOffset_i32ptr_u128, dataOffset_i32ptr_bytes, dataLength_i32], [result], getCache(), ctx.stack, undefined, position, baseFee, addl);
//     return {ctx.stack, position};
// }

// // result i32 Returns 0 on success, 1 on failure and 2 on revert
// export function callDelegate (
//     gas_limit_i64,
//     address,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position}
// ) {
//     const {baseFee} = getPrice('delegatecall');
//     jsvm_env.useGas(baseFee);
//     const result = toBN(jsvm_env.callDelegate(
//         gas_limit_i64,
//         BN2uint8arr(address),
//         dataOffset,
//         dataLength,
//         outputOffset,
//         outputLength
//     ));
//     ctx.stack.push(result);
//     logger.debug('DELEGATECALL', [
//         gas_limit_i64,
//         address,
//         dataOffset,
//         dataLength,
//         outputOffset,
//         outputLength], [result], getCache(), ctx.stack, undefined, position, baseFee,
//     );
//     return {ctx.stack, position};
// }

// // result Returns 0 on success, 1 on failure and 2 on revert
// export function callStatic (
//     gas_limit_i64,
//     address,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position}
// ) {
//     const {baseFee} = getPrice('staticcall');
//     jsvm_env.useGas(baseFee);

//     // Even for precompiles we now pay staticcall gas
//     const addressHex = address.toString(16).padStart(40, '0');
//     if (precompiles[addressHex]) return api.ethereum[precompiles[addressHex]](
//         gas_limit_i64,
//         dataOffset,
//         dataLength,
//         outputOffset,
//         outputLength,
//         {ctx.stack, position},
//     );

//     const result = toBN(jsvm_env.callStatic(
//         gas_limit_i64,
//         BN2uint8arr(address),
//         dataOffset,
//         dataLength,
//         outputOffset,
//         outputLength
//     ));
//     ctx.stack.push(result);
//     logger.debug('STATICCALL', [
//         gas_limit_i64,
//         address,
//         dataOffset,
//         dataLength,
//         outputOffset,
//         outputLength], [result], getCache(), ctx.stack, undefined, position, baseFee);
//     return {ctx.stack, position};
// }

// export function create (
//     value,
//     dataOffset,
//     dataLength,
//     {ctx.stack, position}
// ) {
//     const {baseFee, addl} = getPrice('create', {length: dataLength});
//     jsvm_env.useGas(baseFee);
//     jsvm_env.useGas(addl);
//     const address = toBN(jsvm_env.create(value, dataOffset, dataLength));
//     ctx.stack.push(address);
//     logger.debug('CREATE', [value,
//         dataOffset,
//         dataLength,
//     ], [address], getCache(), ctx.stack, undefined, position, baseFee, addl);
//     return {ctx.stack, position};
// }


// export function selfDestruct (address, ctx: Context, inputs: u256[]): void {
//     const gasCost = getPrice('selfdestruct');
//     jsvm_env.useGas(gasCost);
//     jsvm_env.selfDestruct(BN2uint8arr(address));
//     logger.debug('SELFDESTRUCT', [address], [], getCache(), ctx.stack, undefined, position, gasCost);
//     finishAction({gas: jsvm_env.getGas(), context: jsvm_env.getContext(), logs: jsvm_env.getLogs()});
//     return {ctx.stack, position: 0};
// }

// // precompiles
// export function ecrecover (
//     gas_limit_i64,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position},
// ) {
//     const {baseFee} = getPrice('ecrecover');
//     jsvm_env.useGas(baseFee);

//     const result = toBN(jsvm_env.ecrecover(
//         gas_limit_i64,
//         dataOffset,
//         dataLength,
//         outputOffset,
//         outputLength
//     ));
//     if (result.eqn(0)) ctx.stack.push(toBN(0));
//     else ctx.stack.push(toBN(1));
//     logger.debug('ECRECOVER', [
//         gas_limit_i64,
//         dataOffset,
//         dataLength,
//         outputOffset,
//         outputLength], [result], getCache(), ctx.stack, undefined, position, baseFee);

//     return {ctx.stack, position};
// }

// export function sha256 (
//     gas_limit_i64,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position},
// ) {
//     throw new Error('sha256 not implemented');
// }

// export function ripemd160 (
//     gas_limit_i64,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position},
// ) {
//     throw new Error('ripemd160 not implemented');
// }

// export function modexp (
//     gas_limit_i64,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position},
// ) {
//     throw new Error('modexp not implemented');
// }

// export function ecadd (
//     gas_limit_i64,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position},
// ) {
//     throw new Error('ecadd not implemented');
// }

// export function ecmul (
//     gas_limit_i64,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position},
// ) {
//     throw new Error('ecmul not implemented');
// }

// export function ecpairing (
//     gas_limit_i64,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position},
// ) {
//     throw new Error('ecpairing not implemented');
// }

// export function blake2f (
//     gas_limit_i64,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position},
// ) {
//     throw new Error('blake2f not implemented');
// }
