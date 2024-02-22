import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64, encode } from "as-base64/assembly";
import { IndexedTransaction } from "./types";
import { Base64String } from 'wasmx-env/assembly/types';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import {
    setBlock,
    setIndexedData,
    setConsensusParams,
    setIndexedTransactionByHash,
    getIndexedData,
    getLastBlockIndex,
    getBlockByIndex,
    getBlockByHash,
    getIndexedTransactionByHash,
    getConsensusParams,
    setTopic,
  } from './storage';

// @ts-ignore
@serializable
export class CallData {
    setIndexedData: CallDataSetIndexedData | null = null;
    setBlock: CallDataSetBlock | null = null;
    setConsensusParams: CallDataSetConsensusParams | null = null;
    setIndexedTransactionByHash: CallDataSetIndexedTransactionByHash | null = null;

    getIndexedData: CallDataGetIndexedData | null = null;
    getLastBlockIndex: CallDataGetLastBlockIndex | null = null;
    getBlockByIndex: CallDataGetBlockByIndex | null = null;
    getBlockByHash: CallDataGetBlockByHash | null = null;
    getIndexedTransactionByHash: CallDataGetIndexedTransactionByHash | null = null;
    getConsensusParams: CallDataGetConsensusParams | null = null;

    getContextValue: CallDataGetContextValue | null = null;
}

// @ts-ignore
@serializable
export class CallDataGetContextValue {
    key: string;
    constructor(key: string) {
        this.key = key;
    }
}

// @ts-ignore
@serializable
export class CallDataInstantiate {
    initialBlockIndex: i64
    constructor(initialBlockIndex: i64) {
        this.initialBlockIndex = initialBlockIndex;
    }
}

// @ts-ignore
@serializable
export class CallDataSetIndexedData {
    key: string
    value: string
    constructor(key: string, value: string) {
        this.key = key
        this.value = value
    }
}

// @ts-ignore
@serializable
export class CallDataGetIndexedData {
    key: string
    constructor(key: string) {
        this.key = key
    }
}

// @ts-ignore
@serializable
export class CallDataGetLastBlockIndex {
    constructor() {}
}

// @ts-ignore
@serializable
export class CallDataGetBlockByIndex {
    index: i64;
    constructor(index: i64) {
        this.index = index;
    }
}

// @ts-ignore
@serializable
export class CallDataGetBlockByHash {
    hash: Base64String;
    constructor(hash: Base64String) {
        this.hash = hash;
    }
}

// @ts-ignore
@serializable
export class CallDataGetIndexedTransactionByHash {
    hash: Base64String;
    constructor(hash: Base64String) {
        this.hash = hash;
    }
}

// @ts-ignore
@serializable
export class CallDataGetConsensusParams {
    constructor() {}
}

// @ts-ignore
@serializable
export class IndexedTopic {
    topic: string
    values: string[]
    constructor(topic: string,  values: string[]) {
        this.topic = topic
        this.values = values
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
export class CallDataSetConsensusParams {
    params: Base64String
    constructor(params: Base64String) {
        this.params = params;
    }
}

// @ts-ignore
@serializable
export class CallDataSetIndexedTransactionByHash {
    hash: Base64String;
    data: IndexedTransaction;
    constructor(hash: Base64String, data: IndexedTransaction) {
        this.hash = hash;
        this.data = data;
    }
}

// @ts-ignore
@serializable
export class LastBlockIndexResult {
    index: i64
    constructor(index: i64) {
        this.index = index;
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

export function setConsensusParamsWrap(value: Base64String): ArrayBuffer {
    const params = String.UTF8.decode(decodeBase64(value).buffer);
    setConsensusParams(params);
    return new ArrayBuffer(0);
}

export function getConsensusParamsWrap(): ArrayBuffer {
    const value = getConsensusParams();
    return String.UTF8.encode(value);
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
