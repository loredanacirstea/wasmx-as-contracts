import { JSON } from "json-as";
import * as base64 from "as-base64/assembly";
import { encode as encodeBase64, decode as decodeBase64, encode } from "as-base64/assembly";
import { ConsensusParamsInfo, IndexedTransaction } from "./types";
import { Base64String } from 'wasmx-env/assembly/types';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import {
    setBlock,
    setIndexedData,
    saveConsensusParams,
    setIndexedTransactionByHash,
    getIndexedData,
    getLastBlockIndex,
    getBlockByIndex,
    getBlockByHash,
    getIndexedTransactionByHash,
    getConsensusParams,
    setTopic,
    getConsensusParamsLastIndex,
    setConsensusParams,
    setLastBlockIndex,
    rollbackBlock,
    removeTopic,
    rollbackConsensusParams,
  } from './storage';
import { LoggerDebug, LoggerInfo, revert } from "./utils";

@json
export class CallData {
    setIndexedData: CallDataSetIndexedData | null = null;
    setBlock: CallDataSetBlock | null = null;
    setConsensusParams: CallDataSetConsensusParams | null = null;
    setIndexedTransactionByHash: CallDataSetIndexedTransactionByHash | null = null;
    bootstrapAfterStateSync: CallDataBootstrap | null = null;
    rollback: CalldataRollback | null = null;

    getIndexedData: CallDataGetIndexedData | null = null;
    getLastBlockIndex: CallDataGetLastBlockIndex | null = null;
    getBlockByIndex: CallDataGetBlockByIndex | null = null;
    getBlockByHash: CallDataGetBlockByHash | null = null;
    getIndexedTransactionByHash: CallDataGetIndexedTransactionByHash | null = null;
    getConsensusParams: CallDataGetConsensusParams | null = null;

    getContextValue: CallDataGetContextValue | null = null;
}

@json
export class CallDataGetContextValue {
    key: string;
    constructor(key: string) {
        this.key = key;
    }
}

@json
export class CallDataInstantiate {
    initialBlockIndex: i64
    constructor(initialBlockIndex: i64) {
        this.initialBlockIndex = initialBlockIndex;
    }
}

@json
export class CallDataSetIndexedData {
    key: string
    value: string
    constructor(key: string, value: string) {
        this.key = key
        this.value = value
    }
}

@json
export class CallDataGetIndexedData {
    key: string
    constructor(key: string) {
        this.key = key
    }
}

@json
export class CallDataGetLastBlockIndex {
    constructor() {}
}

@json
export class CallDataGetBlockByIndex {
    index: i64;
    constructor(index: i64) {
        this.index = index;
    }
}

@json
export class CallDataGetBlockByHash {
    hash: Base64String;
    constructor(hash: Base64String) {
        this.hash = hash;
    }
}

@json
export class CallDataGetIndexedTransactionByHash {
    hash: Base64String;
    constructor(hash: Base64String) {
        this.hash = hash;
    }
}

@json
export class CallDataGetConsensusParams {
    height: i64 = 0
    constructor(height: i64) {
        this.height = height
    }
}

@json
export class IndexedTopic {
    topic: string
    values: string[]
    constructor(topic: string,  values: string[]) {
        this.topic = topic
        this.values = values
    }
}

@json
export class CallDataSetBlock {
    value: Base64String
    hash: string
    txhashes: string[]
    indexed_topics: IndexedTopic[]
    constructor(value: Base64String, hash: string, txhashes: string[], indexed_topics: IndexedTopic[]) {
        this.value = value;
        this.hash = hash
        this.txhashes = txhashes
        this.indexed_topics = indexed_topics
    }
}

@json
export class CallDataSetConsensusParams {
    height: i64 = 0
    params: Base64String = ""
    constructor(height: i64, params: Base64String) {
        this.height = height
        this.params = params;
    }
}

@json
export class CallDataSetIndexedTransactionByHash {
    hash: Base64String;
    data: IndexedTransaction;
    constructor(hash: Base64String, data: IndexedTransaction) {
        this.hash = hash;
        this.data = data;
    }
}

@json
export class LastBlockIndexResult {
    index: i64
    constructor(index: i64) {
        this.index = index;
    }
}

@json
export class CallDataBootstrap {
    last_block_height: i64
    last_height_changed: i64
    params: Base64String // base64 encoded JSON stringified consensus params
    constructor(last_block_height: i64, last_height_changed: i64, params: Base64String) {
        this.last_block_height = last_block_height
        this.last_height_changed = last_height_changed
        this.params = params;
    }
}

@json
export class CalldataRollback {
    height: i64
    hash: string
    txhashes: string[]
    indexed_topics: IndexedTopic[]
    constructor(
        height: i64,
        hash: string,
        txhashes: string[],
        indexed_topics: IndexedTopic[],
    ) {
        this.height = height
        this.hash = hash
        this.txhashes = txhashes
        this.indexed_topics = indexed_topics
    }
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    return JSON.parse<CallData>(String.UTF8.decode(calldraw));
}

export function getLastBlockIndexWrap(): ArrayBuffer {
    const index = getLastBlockIndex();
    const result = new LastBlockIndexResult(index);
    return String.UTF8.encode(JSON.stringify<LastBlockIndexResult>(result));
}

export function getBlockByIndexWrap(index: i64): ArrayBuffer {
    const value = getBlockByIndex(index)
    return String.UTF8.encode(value);
}

export function getBlockByHashWrap(hash: string): ArrayBuffer {
    const value = getBlockByHash(hash)
    return String.UTF8.encode(value);
}

export function setBlockWrap(value: string, hash: string, txhashes: string[], indexed_topics: IndexedTopic[]): ArrayBuffer {
    setBlock(value, hash, txhashes)
    for (let i = 0; i < indexed_topics.length; i++) {
        setTopic(indexed_topics[i])
    }
    return new ArrayBuffer(0);
}

export function setConsensusParamsWrap(req: CallDataSetConsensusParams): ArrayBuffer {
    saveConsensusParams(req.height, req.params);
    return new ArrayBuffer(0);
}

export function getConsensusParamsWrap(req: CallDataGetConsensusParams): ArrayBuffer {
    // get the latest height
    if (req.height == 0) {
        req.height = getConsensusParamsLastIndex()
    }
    let info = getConsensusParams(req.height);
    if (info == null) {
        revert(`consensus params not found for height ${req.height}`)
        return new ArrayBuffer(0)
    }
    const lastHeightChanged = info.last_height_changed;
    if (info.params == "") {
        info = getConsensusParams(lastHeightChanged)
    }
    if (info == null) {
        revert(`consensus params not found for height ${req.height}, tried last height changed ${lastHeightChanged}`)
        return new ArrayBuffer(0)
    }
    return base64.decode(info.params).buffer
}

export function getIndexedTransactionByHashWrap(hash: string): ArrayBuffer {
    const value = getIndexedTransactionByHash(hash);
    return String.UTF8.encode(value);
}

export function setIndexedDataWrap(key: string, value: string): ArrayBuffer {
    setIndexedData(key, value);
    return new ArrayBuffer(0);
}

export function getIndexedDataWrap(key: string): ArrayBuffer {
    const value = getIndexedData(key);
    return String.UTF8.encode(value);
}

export function setIndexedTransactionByHashWrap(hash: string, data: IndexedTransaction): ArrayBuffer {
    setIndexedTransactionByHash(hash, data);
    return new ArrayBuffer(0);
}

export function bootstrapAfterStateSync(req: CallDataBootstrap): ArrayBuffer {
    // cometbft just sets last_height_changed as last_block_height + 1
    const info = new ConsensusParamsInfo(req.last_block_height, req.last_block_height, req.params)
    setConsensusParams(info);
    setLastBlockIndex(req.last_block_height);
    return new ArrayBuffer(0);
}

export function rollback(req: CalldataRollback): ArrayBuffer {
    rollbackBlock(req.height, req.hash, req.txhashes)
    LoggerDebug("rolling back indexed topics", ["height", req.height.toString(), "hash", req.hash, "indexed_topics", req.indexed_topics.length.toString(), "txs", req.txhashes.length.toString()])
    for (let i = 0; i < req.indexed_topics.length; i++) {
        removeTopic(req.indexed_topics[i])
    }
    LoggerDebug("rolling back consensus params", ["height", req.height.toString()])
    rollbackConsensusParams(req.height);
    return new ArrayBuffer(0);
}
