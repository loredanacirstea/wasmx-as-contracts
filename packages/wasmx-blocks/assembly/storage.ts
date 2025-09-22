import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import {Base64String } from 'wasmx-env/assembly/types';
import { base64ToHex, base64ToString, parseInt64 } from "wasmx-utils/assembly/utils";
import * as types from './types';
import { LoggerInfo, LoggerDebug, revert } from './utils';
import { IndexedTopic } from "./calldata";

const BLOCK_LAST_INDEX = "block_last_index";
const BLOCK_INDEX_KEY = "block_";
const BLOCK_HASH_KEY = "block_by_hash_";
const TX_INDEXER = "tx_";
const PARAMS_KEY = "consensus_params.";
const PARAMS_LAST_INDEX = "consensus_params_last_index"
const DATA_INDEXER = "data_";

export const LOG_START = 1;

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

export function getConsensusParamsKey(height: i64): string {
    return PARAMS_KEY + height.toString();
}

export function setTopic(indexedTopic: IndexedTopic): void {
    const value = getIndexedData(indexedTopic.topic);
    let values: string[] = [];
    if (value != "") {
        values = JSON.parse<string[]>(value);
    }
    for (let i = 0; i < indexedTopic.values.length; i++) {
        values.push(indexedTopic.values[i])
    }
    setIndexedData(indexedTopic.topic, JSON.stringify<string[]>(values))
}

// only for a rolledback block
export function removeTopic(indexedTopic: IndexedTopic): void {
    const value = getIndexedData(indexedTopic.topic);
    if (value == "") return;
    let values = JSON.parse<string[]>(value);
    const count = indexedTopic.values.length;
    values.splice(values.length - 1 - count, count);
    setIndexedData(indexedTopic.topic, JSON.stringify<string[]>(values))
}

export function getIndexedData(key: string): string {
    return wasmxwrap.sload(keyIndexedData(key));
}

export function setIndexedData(key: string, value: string): void {
    wasmxwrap.sstore(keyIndexedData(key), value);
}

export function removeIndexedData(key: string): void {
    wasmxwrap.sstore(keyIndexedData(key), "");
}

export function getLastBlockIndex(): i64 {
    const valuestr = wasmxwrap.sload(BLOCK_LAST_INDEX);
    if (valuestr != "") {
        const value = parseInt(valuestr);
        return i64(value);
    }
    return i64(LOG_START);
}

export function setLastBlockIndex(index: i64): void {
    wasmxwrap.sstore(BLOCK_LAST_INDEX, index.toString());
}

export function getBlockByIndex(index: i64): string {
    const key = getBlockKey(index);
    return wasmxwrap.sload(key);
}

export function getBlockByHash(hash: Base64String): string {
    const key = getBlockHashKey(hash);
    let value = wasmxwrap.sload(key);
    let index: i64 = 0;
    if (value != "") {
        index = parseInt64(value);
    }
    return getBlockByIndex(index);
}

export function setBlock(value: string, hash: string, txhashes: string[]): void {
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
        setIndexedTransactionByHash(txhashes[i], data);
    }

    // update last index
    setLastBlockIndex(index);
}

export function rollbackBlock(height: i64, hash: string, txhashes: string[]): void {
    const index = getLastBlockIndex();
    if (index != height) revert(`must rollback only the last block: ${index}`)
    const newindex = index -1;
    const value = getBlockByIndex(index);
    if (value == "") return;

    wasmxwrap.sstore(getBlockKey(index), "");
    wasmxwrap.sstore(getBlockHashKey(hash), index.toString());

    for (let i = 0; i < txhashes.length; i++) {
        const data = new types.IndexedTransaction(index, i);
        removeIndexedTransactionByHash(height, i, txhashes[i]);
    }
    setLastBlockIndex(newindex);
}

export function setIndexedTransactionByHash(hash: Base64String, data: types.IndexedTransaction): void {
    const datastr = JSON.stringify<types.IndexedTransaction>(data);
    wasmxwrap.sstore(keyIndexedTransaction(hash), datastr);
    LoggerInfo("indexing transaction", ["height", data.height.toString(), "index", data.index.toString(), "hash", hash, "hashhex", base64ToHex(hash)])
}

export function getIndexedTransactionByHash(hash: Base64String): string {
    return wasmxwrap.sload(keyIndexedTransaction(hash));
}

export function removeIndexedTransactionByHash(height: i64, index: i64, hash: Base64String): void {
    wasmxwrap.sstore(keyIndexedTransaction(hash), "");
    LoggerInfo("rolled back indexed transaction", ["height", height.toString(), "index", index.toString(), "hash", hash, "hashhex", base64ToHex(hash)])
}

export function getConsensusParams(height: i64): types.ConsensusParamsInfo | null {
    const resp = wasmxwrap.sload(getConsensusParamsKey(height));
    if (resp == "") return null;
    return JSON.parse<types.ConsensusParamsInfo>(resp);
}

export function saveConsensusParams(height: i64, params: Base64String): void {
    const newinfo = new types.ConsensusParamsInfo(height, height, params)
    const lastHeight = getConsensusParamsLastIndex()
    const info = getConsensusParams(lastHeight);
    if (info != null) {
        // if we already know params have not changed, we just copy last height changed
        if (params == "") {
            newinfo.last_height_changed = info.last_height_changed
        } else {
            let oldparams = info.params
            if (oldparams == "") {
                const paramsInfo = getConsensusParams(info.last_height_changed)
                if (paramsInfo == null) {
                    revert(`empty consensus params at last height changed`)
                    return;
                }
                oldparams = paramsInfo.params;
            }
            if (params == oldparams) {
                newinfo.last_height_changed = info.last_height_changed
                newinfo.params = ""
            }
        }
    }
    LoggerDebug("setting consensus parameters", ["params", params, "height", height.toString(), "entry", JSON.stringify<types.ConsensusParamsInfo>(newinfo)])
    setConsensusParams(newinfo)
}

export function setConsensusParams(info: types.ConsensusParamsInfo): void {
    const value = JSON.stringify<types.ConsensusParamsInfo>(info)
    wasmxwrap.sstore(getConsensusParamsKey(info.height), value);
    setConsensusParamsLastIndex(info.height)
}

export function rollbackConsensusParams(height: i64): void {
    // last height should be height+1 - we store params for next block
    const lastHeight = getConsensusParamsLastIndex()
    if (height != (lastHeight -1)) revert(`consensus params rollback failed, must rollback last height: ${lastHeight-1}`);
    wasmxwrap.sstore(getConsensusParamsKey(lastHeight), "");
    setConsensusParamsLastIndex(height);
}

export function getConsensusParamsLastIndex(): i64 {
    const index = wasmxwrap.sload(PARAMS_LAST_INDEX)
    if (index == "") return LOG_START;
    return parseInt64(index)
}

export function setConsensusParamsLastIndex(height: i64): void {
    wasmxwrap.sstore(PARAMS_LAST_INDEX, height.toString())
}

export function getContextValue(key: string): ArrayBuffer {
    return wasmx.storageLoad(String.UTF8.encode(key));
}
