import { JSON } from "json-as/assembly";
import * as types from './types';
import * as wasmx from './wasmx';
import * as wasmxwrap from './wasmx_wrap';
import { revert, parseInt64 } from "./utils";

const BLOCK_LAST_INDEX = "block_last_index";
const BLOCK_INDEX_KEY = "block_";
const BLOCK_HASH_KEY = "block_by_hash_";
const TX_INDEXER = "tx_";
const PARAMS_KEY = "consensus_params";
const DATA_INDEXER = "data_";

export function getBlockKey(index: i64): string {
    return BLOCK_INDEX_KEY + index.toString();
}

export function getBlockHashKey(hash: string): string {
    return BLOCK_HASH_KEY + hash;
}

function keyIndexedTransaction(hash: string): string {
    return TX_INDEXER + hash;
}

function keyIndexedData(key: string): string {
    return DATA_INDEXER + key;
}

export function getIndexedData(key: string): string {
    return wasmxwrap.sload(keyIndexedData(key));
}

export function setIndexedData(key: string, value: string): void {
    wasmxwrap.sstore(keyIndexedData(key), value);
}

export function getLastBlockIndex(): i64 {
    const valuestr = wasmxwrap.sload(BLOCK_LAST_INDEX);
    if (valuestr != "") {
        const value = parseInt(valuestr);
        return i64(value);
    }
    return i64(0);
}

export function setLastBlockIndex(index: i64): void {
    wasmxwrap.sstore(BLOCK_LAST_INDEX, index.toString());
}

export function getBlockByIndex(index: i64): string {
    const key = getBlockKey(index);
    return wasmxwrap.sload(key);
}

export function getBlockByHash(hash: types.Base64String): string {
    const key = getBlockHashKey(hash);
    let value = wasmxwrap.sload(key);
    let index: i64 = 0;
    if (value != "") {
        index = parseInt64(value);
    }
    return getBlockByIndex(index);
}

export function setBlock(value: string, hash: string, txhashes: string[]) {
    const block = JSON.parse<types.BlockEntry>(value);
    const index = getLastBlockIndex() + 1;
    if (block.index != index) {
        revert(`cannot store block with index ${block.index.toString()}; expected ${index.toString()}`)
    }

    // store block
    const blockValue = JSON.stringify<types.BlockEntry>(block);
    wasmxwrap.sstore(getBlockKey(index), blockValue);

    // index block by hash
    wasmxwrap.sstore(getBlockHashKey(hash), index.toString());

    // index transactions
    for (let i = 0; i < txhashes.length; i++) {
        const data = new types.IndexedTransaction(index, i);
        const datastr = JSON.stringify<types.IndexedTransaction>(data);
        wasmxwrap.sstore(keyIndexedTransaction(txhashes[i]), datastr);
        wasmxwrap.LoggerInfo("indexing transaction", ["hash", txhashes[i]])
    }

    // update last index
    setLastBlockIndex(index);
    return index;
}

export function getIndexedTransactionByHash(hash: types.Base64String): string {
    return wasmxwrap.sload(keyIndexedTransaction(hash));
}

export function getConsensusParams(): string {
    return wasmxwrap.sload(PARAMS_KEY);
}

export function setConsensusParams(value: string): void {
    wasmxwrap.LoggerDebug("setting consensus parameters", ["params", value])
    wasmxwrap.sstore(PARAMS_KEY, value);
}
