import { u256 } from 'as-bignum/assembly';
import { Context } from './context';
import * as ERROR from './error';
import * as wasmx from './wasmx';

// const {
//     hexToUint8Array,
//     toBN,
//     BN2hex,
//     BN2uint8arr,
//     keccak256,
// }  = require('./utils.js');
// const evmgas = require('./evmGasPrices');
// const {getPrice} = evmgas;

// export const opcodesMap = new Map<string,Function>();

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
    console.log('loadMemory')
    // const gasCost = getPrice('mload');
    // jsvm_env.useGas(gasCost);
    const offset = inputs[0].toI32();
    const result = ctx.memory.load(offset, 32)
    ctx.stack.push(u256.fromBytesBE(result));
    // const changed = {memory: [offset.toNumber(), BN2hex(result), 0]}
    // logger.debug('MLOAD', [offset], [result], getCache(), ctx.stack, changed, position, gasCost);
}

export function storeMemory (ctx: Context, inputs: u256[]): void {
    console.log('storeMemory')
    const offset = inputs[0].toI32();
    const value = inputs[1].toBytes(true);
    // const {
    //     baseFee,
    //     addl,
    //     highestMemCost,
    //     memoryWordCount
    // } = getPrice('mstore', {
    //     offset,
    //     length: toBN(value.length),
    //     memWordCount: jsvm_env.memWordCount(),
    //     highestMemCost: jsvm_env.highestMemCost(),
    // });
    // jsvm_env.useGas(baseFee);
    // if (addl) jsvm_env.useGas(addl);
    // if (highestMemCost) jsvm_env.setHighestMemCost(highestMemCost);
    // if (memoryWordCount) jsvm_env.setMemWordCount(memoryWordCount);
    ctx.memory.store(value, offset)
    // const changed = {memory: [offset.toNumber(), value, 1]}
    // logger.debug('MSTORE', [bytes, offset], [], getCache(), ctx.stack, changed, position, baseFee, addl);
}

// export function storeMemory8 (offset, bytes, {ctx.stack, position}) {
//     const gasCost = getPrice('mstore8');
//     jsvm_env.useGas(gasCost);
//     const value = BN2uint8arr(bytes);
//     jsvm_env.storeMemory8(value, offset);
//     const changed = {memory: [offset.toNumber(), value, 1]}
//     logger.debug('MSTORE8', [bytes, offset], [], getCache(), ctx.stack, changed, position, gasCost);
//     return;
// }

// export function loadMemory (offset, {ctx.stack, position}) {
//     const gasCost = getPrice('mload');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(jsvm_env.loadMemory(offset));
//     ctx.stack.push(result);
//     const changed = {memory: [offset.toNumber(), BN2hex(result), 0]}
//     logger.debug('MLOAD', [offset], [result], getCache(), ctx.stack, changed, position, gasCost);
//     return {ctx.stack, position};
// }

// export function useGas (amount) {
//     jsvm_env.useGas(amount);
//     logger.debug('USEGAS', [amount], [], getCache(), ctx.stack, undefined, position, 0);
//     return;
// }

// export function getAddress ({ctx.stack, position}) {
//     const gasCost = getPrice('address');
//     jsvm_env.useGas(gasCost);
//     const address = toBN(jsvm_env.getAddress());
//     ctx.stack.push(address);
//     logger.debug('ADDRESS', [], [address], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// // result is u128
// export function getExternalBalance (_address, {ctx.stack, position}){
//     const {baseFee, addl} = getPrice('balance');
//     jsvm_env.useGas(baseFee);
//     jsvm_env.useGas(addl);
//     const address = BN2uint8arr(_address);
//     const balance = toBN(jsvm_env.getExternalBalance(address));
//     ctx.stack.push(balance);
//     logger.debug('BALANCE', [_address], [balance], getCache(), ctx.stack, undefined, position, baseFee, addl);
//     return {ctx.stack, position};
// }

// // result i32 Returns 0 on success and 1 on failure
// export function getBlockHash (number, {ctx.stack, position}) {
//     const gasCost = getPrice('blockhash');
//     jsvm_env.useGas(gasCost);
//     const hash = toBN(jsvm_env.getBlockHash(number));
//     ctx.stack.push(hash);
//     logger.debug('BLOCKHASH', [number], [hash], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// // result i32 Returns 0 on success, 1 on failure and 2 on revert
// export function call (
//     gas_limit,
//     address, // the memory offset to load the address from (address)
//     value,
//     dataOffset,
//     dataLength,
//     outputOffset,
//     outputLength,
//     {ctx.stack, position}
// ) {
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

// export function callDataCopy (resultOffset, dataOffset, length, {ctx.stack, position}) {
//     const {
//         baseFee,
//         addl,
//         highestMemCost,
//         memoryWordCount
//     } = getPrice('calldatacopy', {
//         offset: resultOffset,
//         length: toBN(length),
//         memWordCount: jsvm_env.memWordCount(),
//         highestMemCost: jsvm_env.highestMemCost(),
//     });
//     jsvm_env.useGas(baseFee);
//     if (addl) jsvm_env.useGas(addl);
//     if (highestMemCost) jsvm_env.setHighestMemCost(highestMemCost);
//     if (memoryWordCount) jsvm_env.setMemWordCount(memoryWordCount);

//     const result = jsvm_env.callDataCopy(resultOffset, dataOffset, length);
//     const changed = {memory: [resultOffset.toNumber(), result, 1]};
//     logger.debug('CALLDATACOPY', [resultOffset, dataOffset, length], [result], getCache(), ctx.stack, changed, position, baseFee, addl);
//     return;
// }

// export function getCallDataSize ({ctx.stack, position}) {
//     const gasCost = getPrice('calldatasize');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(jsvm_env.getCallDataSize());
//     ctx.stack.push(result);
//     logger.debug('CALLDATASIZE', [], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function callDataLoad (dataOffset, {ctx.stack, position}) {
//     const gasCost = getPrice('calldataload');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(jsvm_env.callDataLoad(dataOffset));
//     ctx.stack.push(result);
//     const changed = {memory: [dataOffset.toNumber(), result, 0]};
//     logger.debug('CALLDATALOAD', [dataOffset], [result], getCache(), ctx.stack, changed, position, gasCost);
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

// export function storageStore (pathOffset, value, {ctx.stack, position}) {
//     const key = BN2uint8arr(pathOffset);
//     // TODO correct original value after EIP 2200
//     const origValue = toBN(jsvm_env.storageLoadOriginal(key));
//     const currentValue = toBN(jsvm_env.storageLoad(key));
//     const count = jsvm_env.storageRecords.write(key);
//     const gasLeft = toBN(jsvm_env.getGasLeft());
//     const {baseFee, addl, refund} = getPrice('sstore', {count, value, currentValue, origValue, gasLeft});
//     jsvm_env.useGas(baseFee);
//     if (addl) jsvm_env.useGas(addl);
//     if (refund) jsvm_env.refundGas(refund);
//     jsvm_env.storageStore(key, BN2uint8arr(value));
//     const changed = {storage: [BN2hex(pathOffset), BN2hex(value), 1]}
//     logger.debug('SSTORE', [pathOffset, value], [], getCache(), ctx.stack, changed, position, baseFee, addl, refund);
//     return;
// }

// export function storageLoad (pathOffset, {ctx.stack, position}) {
//     const key = BN2uint8arr(pathOffset);
//     const count = jsvm_env.storageRecords.read(key);
//     const {baseFee, addl} = getPrice('sload');
//     jsvm_env.useGas(baseFee);
//     jsvm_env.useGas(addl);
//     const result = toBN(jsvm_env.storageLoad(key));
//     ctx.stack.push(result);
//     const changed = {storage: [BN2hex(pathOffset), BN2hex(result), 0]}
//     logger.debug('SLOAD', [pathOffset], [result], getCache(), ctx.stack, changed, position, baseFee, addl);
//     return {ctx.stack, position};
// }

// export function getCaller ({ctx.stack, position}) {
//     const gasCost = getPrice('caller');
//     jsvm_env.useGas(gasCost);
//     const address = toBN(jsvm_env.getCaller());
//     ctx.stack.push(address);
//     logger.debug('CALLER', [], [address], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function getCallValue ({ctx.stack, position}) {
//     const gasCost = getPrice('callvalue');
//     jsvm_env.useGas(gasCost);
//     const value = toBN(jsvm_env.getCallValue());
//     ctx.stack.push(value);
//     logger.debug('CALLVALUE', [], [value], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function codeCopy (resultOffset, codeOffset, length, {ctx.stack, position}) {
//     const {
//         baseFee,
//         addl,
//         highestMemCost,
//         memoryWordCount
//     } = getPrice('codecopy', {
//         offset: resultOffset,
//         length: toBN(length),
//         memWordCount: jsvm_env.memWordCount(),
//         highestMemCost: jsvm_env.highestMemCost(),
//     });
//     jsvm_env.useGas(baseFee);
//     if (addl) jsvm_env.useGas(addl);
//     if (highestMemCost) jsvm_env.setHighestMemCost(highestMemCost);
//     if (memoryWordCount) jsvm_env.setMemWordCount(memoryWordCount);

//     const result = jsvm_env.codeCopy(resultOffset, codeOffset, length);
//     const changed = {memory: [resultOffset.toNumber(), result, 1]};
//     logger.debug('CODECOPY', [resultOffset, codeOffset, length], [], getCache(), ctx.stack, changed, position, baseFee, addl);
//     return;
// }

// // returns i32 - code size current env
// export function getCodeSize ({ctx.stack, position}) {
//     const gasCost = getPrice('codesize');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(jsvm_env.getCodeSize());
//     ctx.stack.push(result);
//     logger.debug('CODESIZE', [], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// // block’s beneficiary address
// export function getBlockCoinbase ({ctx.stack, position}) {
//     const gasCost = getPrice('coinbase');
//     jsvm_env.useGas(gasCost);
//     const value = toBN(jsvm_env.getBlockCoinbase());
//     ctx.stack.push(value);
//     logger.debug('COINBASE', [], [value], getCache(), ctx.stack, undefined, position, gasCost);
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

// export function getBlockDifficulty ({ctx.stack, position}) {
//     const gasCost = getPrice('difficulty');
//     jsvm_env.useGas(gasCost);
//     const value = toBN(jsvm_env.getBlockDifficulty());
//     ctx.stack.push(value);
//     logger.debug('DIFFICULTY', [], [value], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function externalCodeCopy (
//     address,
//     resultOffset,
//     codeOffset,
//     dataLength,
//     {ctx.stack, position}
// ) {
//     const {
//         baseFee,
//         addl,
//         highestMemCost,
//         memoryWordCount
//     } = getPrice('extcodecopy', {
//         offset: resultOffset,
//         length: dataLength,
//         memWordCount: jsvm_env.memWordCount(),
//         highestMemCost: jsvm_env.highestMemCost(),
//     });
//     jsvm_env.useGas(baseFee);
//     if (addl) jsvm_env.useGas(addl);
//     if (highestMemCost) jsvm_env.setHighestMemCost(highestMemCost);
//     if (memoryWordCount) jsvm_env.setMemWordCount(memoryWordCount);

//     const result = jsvm_env.externalCodeCopy(
//         BN2uint8arr(address),
//         resultOffset,
//         codeOffset,
//         dataLength,
//     )
//     const changed = {memory: [resultOffset.toNumber(), result, 1]};
//     logger.debug('EXTCODECOPY', [address,
//         resultOffset,
//         codeOffset,
//         dataLength,
//     ], [], getCache(), ctx.stack, changed, position, baseFee, addl);
//     return;
// }

// // Returns extCodeSize i32
// export function getExternalCodeSize (address, {ctx.stack, position}) {
//     const {baseFee, addl} = getPrice('extcodesize');
//     jsvm_env.useGas(baseFee);
//     jsvm_env.useGas(addl);
//     const result = toBN(jsvm_env.getExternalCodeSize(BN2uint8arr(address)));
//     ctx.stack.push(result);
//     logger.debug('EXTCODESIZE', [address], [result], getCache(), ctx.stack, undefined, position, baseFee, addl);
//     return {ctx.stack, position};
// }

// // result gasLeft i64
// export function getGasLeft ({ctx.stack, position}) {
//     const gasCost = getPrice('gas');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(jsvm_env.getGasLeft());
//     ctx.stack.push(result);
//     logger.debug('GAS', [], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// // result blockGasLimit i64
// export function getBlockGasLimit ({ctx.stack, position}) {
//     const gasCost = getPrice('gaslimit');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(jsvm_env.getBlockGasLimit());
//     ctx.stack.push(result);
//     logger.debug('GASLIMIT', [], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function getTxGasPrice ({ctx.stack, position}) {
//     const gasCost = getPrice('gasprice');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(jsvm_env.getTxGasPrice());
//     ctx.stack.push(result);
//     logger.debug('GASPRICE', [], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function log (
//     dataOffset,
//     dataLength,
//     ...topics
// ) {
//     const {ctx.stack, position} = topics.pop();
//     const numberOfTopics = topics.length;

//     const {baseFee, addl} = getPrice('log', {topics: toBN(topics.length), length: dataLength});
//     jsvm_env.useGas(baseFee);
//     jsvm_env.useGas(addl);

//     jsvm_env.log(
//         dataOffset,
//         dataLength,
//         numberOfTopics,
//         topics,
//     );
//     logger.debug('LOG' + numberOfTopics, [dataOffset,
//         dataLength,
//         numberOfTopics,
//         ...topics
//     ], [], getCache(), ctx.stack, undefined, position, baseFee, addl);
//     return;
// }

// export function log0 (dataOffset, dataLength, ...topics) {
//     return api.ethereum.log(dataOffset, dataLength, ...topics);
// }

// export function log1 (dataOffset, dataLength, ...topics) {
//     return api.ethereum.log(dataOffset, dataLength, ...topics);
// }

// export function log2 (dataOffset, dataLength, ...topics) {
//     return api.ethereum.log(dataOffset, dataLength, ...topics);
// }

// export function log3 (dataOffset, dataLength, ...topics) {
//     return api.ethereum.log(dataOffset, dataLength, ...topics);
// }

// export function log4 (dataOffset, dataLength, ...topics) {
//     return api.ethereum.log(dataOffset, dataLength, ...topics);
// }

// // result blockNumber i64
// export function getBlockNumber ({ctx.stack, position}) {
//     const gasCost = getPrice('number');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(jsvm_env.getBlockNumber());
//     ctx.stack.push(result);
//     logger.debug('NUMBER', [], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function getTxOrigin ({ctx.stack, position}) {
//     const gasCost = getPrice('origin');
//     jsvm_env.useGas(gasCost);
//     const address = toBN(jsvm_env.getTxOrigin());
//     ctx.stack.push(address);
//     logger.debug('ORIGIN', [], [address], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

export function finish (ctx: Context, inputs: u256[]): void {
    // const gasCost = getPrice('return');
    // jsvm_env.useGas(gasCost);
    // const result = jsvm_env.finish(dataOffset, dataLength);
    // logger.debug('FINISH', [dataOffset, dataLength], [result], getCache(), ctx.stack, undefined, position, gasCost);
    // finishAction({result, gas: jsvm_env.getGas(), context: jsvm_env.getContext(), logs: jsvm_env.getLogs()});

    const dataOffset = inputs[0];
    const dataLength = inputs[1];

    const result = ctx.memory.load(dataOffset.toI32(), dataLength.toI32());
    ctx.pc = 0;
    ctx.env.currentCall.returnData = result;
    ctx.env.currentCall.returnDataSuccess = 0;
    wasmx.finish(u8ArrayToArrayBuffer(result));
    // throw new Error(ERROR.STOP);
}

export function stop (ctx: Context, inputs: u256[]): void {
    // const gasCost = getPrice('stop');
    // jsvm_env.useGas(gasCost);

    // logger.debug('STOP', [], [], getCache(), ctx.stack, undefined, position, gasCost);

    // finishAction({gas: jsvm_env.getGas(), context: jsvm_env.getContext(), logs: jsvm_env.getLogs()});
    ctx.pc = 0;
}

// export function revert (dataOffset, dataLength, {ctx.stack, position}) {
//     const gasCost = getPrice('revert');
//     jsvm_env.useGas(gasCost);
//     const result = jsvm_env.revert(dataOffset, dataLength);
//     logger.debug('REVERT', [dataOffset, dataLength], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     revertAction({result, gas: jsvm_env.getGas()});
//     return {ctx.stack, position: 0};
// }

// // result dataSize i32
// export function getReturnDataSize ({ctx.stack, position}) {
//     const gasCost = getPrice('returndatasize');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(jsvm_env.getReturnDataSize());
//     ctx.stack.push(result);
//     logger.debug('RETURNDATASIZE', [], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function returnDataCopy (resultOffset, dataOffset, length, {ctx.stack, position}) {
//     const {
//         baseFee,
//         addl,
//         highestMemCost,
//         memoryWordCount
//     } = getPrice('returndatacopy', {
//         offset: resultOffset,
//         length: toBN(length),
//         memWordCount: jsvm_env.memWordCount(),
//         highestMemCost: jsvm_env.highestMemCost(),
//     });
//     jsvm_env.useGas(baseFee);
//     if (addl) jsvm_env.useGas(addl);
//     if (highestMemCost) jsvm_env.setHighestMemCost(highestMemCost);
//     if (memoryWordCount) jsvm_env.setMemWordCount(memoryWordCount);

//     const result = jsvm_env.returnDataCopy(resultOffset, dataOffset, length);
//     const changed = {memory: [resultOffset.toNumber(), result, 1]};
//     logger.debug('RETURNDATACOPY', [resultOffset, dataOffset, length], [], getCache(), ctx.stack, changed, position, baseFee, addl);
//     return;
// }

// export function selfDestruct (address, {ctx.stack, position}) {
//     const gasCost = getPrice('selfdestruct');
//     jsvm_env.useGas(gasCost);
//     jsvm_env.selfDestruct(BN2uint8arr(address));
//     logger.debug('SELFDESTRUCT', [address], [], getCache(), ctx.stack, undefined, position, gasCost);
//     finishAction({gas: jsvm_env.getGas(), context: jsvm_env.getContext(), logs: jsvm_env.getLogs()});
//     return {ctx.stack, position: 0};
// }

// export function getBlockTimestamp ({ctx.stack, position}) {
//     const gasCost = getPrice('timestamp');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(jsvm_env.getBlockTimestamp());
//     ctx.stack.push(result);
//     logger.debug('TIMESTAMP', [], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function keccak256 (offset, length, {ctx.stack, position}) => {
//     const {baseFee, addl} = getPrice('keccak256', {length});
//     jsvm_env.useGas(baseFee);
//     jsvm_env.useGas(addl);
//     const slots = Math.ceil(length.toNumber() / 32);
//     const data = [...new Array(slots).keys()].map(index => {
//         const delta = toBN(index * 32);
//         return jsvm_env.loadMemory(offset.add(delta));
//     }).reduce((accum, value) => {
//         return new Uint8Array([...accum, ...value]);
//     }, []);
//     const hash = keccak256(data);
//     const result = toBN(hash);
//     ctx.stack.push(result);
//     logger.debug('keccak256', [offset, length], [result], getCache(), ctx.stack, undefined, position, baseFee, addl);
//     return {ctx.stack, position};
// }

// export function uint256Max: () => new BN('10000000000000000000000000000000000000000000000000000000000000000', 16),
// // mimick evm overflow
// export function add (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('add');
//     jsvm_env.useGas(gasCost);
//     const result = a.add(b).mod(api.ethereum.uint256Max());
//     ctx.stack.push(result);
//     logger.debug('ADD', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function mul (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('mul');
//     jsvm_env.useGas(gasCost);
//     const result = a.mul(b).mod(api.ethereum.uint256Max());
//     ctx.stack.push(result);
//     logger.debug('MUL', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// // mimick evm underflow
// export function sub (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('sub');
//     jsvm_env.useGas(gasCost);
//     const result = a.sub(b).mod(api.ethereum.uint256Max());
//     ctx.stack.push(result);
//     logger.debug('SUB', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function div (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('div');
//     jsvm_env.useGas(gasCost);
//     let result;
//     if (b.isZero()) result = toBN(0);
//     else result = a.abs().div(b.abs());
//     ctx.stack.push(result);
//     logger.debug('DIV', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function sdiv (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('sdiv');
//     jsvm_env.useGas(gasCost);
//     let result;
//     const _a = a.fromTwos(256);
//     const _b = b.fromTwos(256);
//     if (_b.isZero()) result = toBN(0);
//     else result = _a.div(_b);
//     ctx.stack.push(result);
//     logger.debug('SDIV', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function mod (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('mod');
//     jsvm_env.useGas(gasCost);
//     const result = a.abs().mod(b.abs());
//     ctx.stack.push(result);
//     logger.debug('MOD', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function smod (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('smod');
//     jsvm_env.useGas(gasCost);
//     let result;
//     const _a = a.fromTwos(256);
//     const _b = b.fromTwos(256);
//     if (_b.isZero()) result = toBN(0);
//     else result = _a.mod(_b);
//     ctx.stack.push(result);
//     logger.debug('SMOD', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function addmod (a, b, c, {ctx.stack, position}) => {
//     const gasCost = getPrice('addmod');
//     jsvm_env.useGas(gasCost);
//     const result = api.ethereum.mod(api.ethereum.add(a, b), c);
//     ctx.stack.push(result);
//     logger.debug('ADDMOD', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function mulmod (a, b, c, {ctx.stack, position}) => {
//     const gasCost = getPrice('mulmod');
//     jsvm_env.useGas(gasCost);
//     const result = api.ethereum.mod(api.ethereum.mul(a, b), c);
//     ctx.stack.push(result);
//     logger.debug('MULMOD', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function exp (a, b, {ctx.stack, position}) => {
//     const {baseFee, addl} = getPrice('exp', {exponent: b});
//     jsvm_env.useGas(baseFee);
//     jsvm_env.useGas(addl);
//     if (b.lt(toBN(0))) return toBN(0);
//     const result = a.pow(b);
//     ctx.stack.push(result);
//     logger.debug('EXP', [a, b], [result], getCache(), ctx.stack, undefined, position, baseFee, addl);
//     return {ctx.stack, position};
// }

// export function signextend (size, value, {ctx.stack, position}) => {
//     const gasCost = getPrice('signextend');
//     jsvm_env.useGas(gasCost);
//     const result = value;
//     ctx.stack.push(result);
//     logger.debug('SIGNEXTEND', [size, value], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function lt (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('lt');
//     jsvm_env.useGas(gasCost);
//     let result = a.abs().lt(b.abs());
//     result = toBN(result ? 1 : 0);
//     ctx.stack.push(result);
//     logger.debug('LT', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function gt (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('gt');
//     jsvm_env.useGas(gasCost);
//     let result = a.abs().gt(b.abs());
//     result = toBN(result ? 1 : 0);
//     ctx.stack.push(result);
//     logger.debug('GT', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function slt (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('slt');
//     jsvm_env.useGas(gasCost);
//     const _a = a.fromTwos(256);
//     const _b = b.fromTwos(256);
//     let result = _a.lt(_b);
//     result = toBN(result ? 1 : 0);
//     ctx.stack.push(result);
//     logger.debug('SLT', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function sgt (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('sgt');
//     jsvm_env.useGas(gasCost);
//     const _a = a.fromTwos(256);
//     const _b = b.fromTwos(256);
//     let result = _a.gt(_b);
//     result = toBN(result ? 1 : 0);
//     ctx.stack.push(result);
//     logger.debug('SGT', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function eq (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('eq');
//     jsvm_env.useGas(gasCost);
//     let result = a.eq(b);
//     result = toBN(result ? 1 : 0);
//     ctx.stack.push(result);
//     logger.debug('EQ', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function iszero (a, {ctx.stack, position}) => {
//     const gasCost = getPrice('iszero');
//     jsvm_env.useGas(gasCost);
//     let result = a.isZero();
//     result = toBN(result ? 1 : 0);
//     ctx.stack.push(result);
//     logger.debug('ISZERO', [a], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function and (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('and');
//     jsvm_env.useGas(gasCost);
//     const result = a.and(b);
//     ctx.stack.push(result);
//     logger.debug('AND', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function or (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('or');
//     jsvm_env.useGas(gasCost);
//     const result = a.or(b);
//     ctx.stack.push(result);
//     logger.debug('OR', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function xor (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('xor');
//     jsvm_env.useGas(gasCost);
//     const result = a.xor(b);
//     ctx.stack.push(result);
//     logger.debug('XOR', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function not (a, {ctx.stack, position}) => {
//     const gasCost = getPrice('not');
//     jsvm_env.useGas(gasCost);
//     const result = a.notn(256);
//     ctx.stack.push(result);
//     logger.debug('NOT', [a], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function byte (nth, bb, {ctx.stack, position}) => {
//     const gasCost = getPrice('byte');
//     jsvm_env.useGas(gasCost);
//     const result = toBN(BN2uint8arr(bb).slice(nth, nth + 1));
//     ctx.stack.push(result);
//     logger.debug('BYTE', [bb], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function shl (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('shl');
//     jsvm_env.useGas(gasCost);
//     const numberOfBits = a.toNumber();
//     const result = b.shln(numberOfBits);
//     result.imaskn(256);  // clear bits with indexes higher or equal to 256
//     ctx.stack.push(result);
//     logger.debug('SHL', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function shr (a, b, {ctx.stack, position}) => {
//     const gasCost = getPrice('shr');
//     jsvm_env.useGas(gasCost);
//     const result = b.shrn(a.toNumber());
//     ctx.stack.push(result);
//     logger.debug('SHR', [a, b], [result], getCache(), ctx.stack, undefined, position, gasCost);
//     return {ctx.stack, position};
// }

// export function sar (nobits, value, {ctx.stack, position}) => {
//     const gasCost = getPrice('sar');
//     jsvm_env.useGas(gasCost);
//     const _nobits = nobits.toNumber();
//     let valueBase2;
//     if (value.isNeg()) {
//         valueBase2 = value.toTwos(256).toString(2);
//     } else {
//         valueBase2 = value.toString(2).padStart(256, '0');
//     }
//     // remove LSB * _nobits
//     valueBase2 = valueBase2.substring(0, valueBase2.length - _nobits);
//     // add MSB * _nobits
//     valueBase2 = valueBase2[0].repeat(_nobits) + valueBase2;
//     const result = (new BN(valueBase2, 2)).fromTwos(256);
//     ctx.stack.push(result);
//     // logger.debug('SAR', [nobits, value], [result], getCache(), ctx.stack, undefined, position, gasCost);
// }

export function handlePush (ctx: Context, code: u8): void {
    // const gasCost = getPrice('push');
    // jsvm_env.useGas(gasCost);
    // const _position = ctx.pc;
    const no = code - 0x60 + 1;
    console.log("push");
    console.log(no.toString())
    console.log(ctx.bytecode.slice(ctx.pc, ctx.pc + no).toString())
    const _value = new Array<u8>(32 - no).concat(ctx.bytecode.slice(ctx.pc, ctx.pc + no))
    console.log(_value.toString())
    const value = u256.fromBytesBE(_value);
    console.log(value.toString())
    ctx.stack.push(value);
    ctx.pc += no;
    // logger.debug('PUSH' + no + ' 0x' + value.toString(16).padStart(no*2, '0'), [value], [], getCache(), ctx.stack, undefined, _position, gasCost);
}

export function handleSwap (ctx: Context, code: u8): void {
    // const gasCost = getPrice('swap');
    // jsvm_env.useGas(gasCost);
    const no = code - 0x90 + 1;
    ctx.stack.swap(no);
}

export function handleDup (ctx: Context, code: u8): void {
    // const gasCost = getPrice('dup');
    // jsvm_env.useGas(gasCost);
    const no = code - 0x80 + 1;
    ctx.stack.dup(no);

    // logger.debug('DUP' + no, [], [], getCache(), ctx.stack, undefined, position, gasCost);
}

export function jump (ctx: Context, inputs: u256[]): void {
    // const gasCost = getPrice('jump');
    // jsvm_env.useGas(gasCost);
    const newpos = inputs[0].toI32();
    if (!newpos && newpos !== 0) throw new Error(`Invalid JUMP ${newpos}`);
    ctx.pc = newpos;

    // logger.debug('JUMP', [newpos], [], getCache(), ctx.stack, undefined, position, gasCost);
}

export function jumpi (ctx: Context, inputs: u256[]): void {
    // const gasCost = getPrice('jumpi');
    // jsvm_env.useGas(gasCost);
    const newpos = inputs[0].toI32();
    // EVM allows any uint256 except from 0 to be interpreted as true
    const condition = inputs[1].toBool();
    if (condition) ctx.pc = newpos;
    // logger.debug('JUMPI', [condition, newpos], [], getCache(), ctx.stack, undefined, _position, gasCost);
}

// export function jumpdest ({ctx.stack, position}) => {
//     const gasCost = getPrice('jumpdest');
//     jsvm_env.useGas(gasCost);
//     logger.debug('JUMPDEST', [], [], getCache(), ctx.stack, undefined, position, gasCost);
// }

export function pop (ctx: Context, inputs: u256[]): void {
    // const gasCost = getPrice('pop');
    // jsvm_env.useGas(gasCost);
    ctx.stack.pop();
    // logger.debug('POP', [], [], getCache(), ctx.stack, undefined, position, gasCost);
}

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


function u8ArrayToArrayBuffer(u8Array: u8[]): ArrayBuffer {
    const length = u8Array.length;
    const buffer = new ArrayBuffer(length);
    const uint8View = Uint8Array.wrap(buffer);

    for (let i = 0; i < length; i++) {
      uint8View[i] = u8Array[i];
    }
    return buffer;
}
