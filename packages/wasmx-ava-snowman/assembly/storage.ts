import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import { CurrentState, Mempool } from "./types_blockchain";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import { parseInt32, parseInt64 } from "wasmx-utils/assembly/utils";
import { LogEntry, LogEntryAggregate, TempBlock, NodeInfo } from "./types";
import { LoggerDebug, LoggerDebugExtended, revert } from "./utils";
import {
    NODE_IPS,
    CURRENT_NODE_ID,
    ROUNDS_KEY,
    LOG_START,
    MEMPOOL_KEY,
    MAX_TX_BYTES,
    VALIDATORS_KEY,
    STATE_KEY,
    CONFIDENCE_KEY,
    CONFIDENCES_KEY,
    BLOCKS_KEY,
} from './config';

export function getConfidence(hash: string): i32 {
    const value = fsm.getContextValue(CONFIDENCE_KEY + hash);
    if (value === "") return i32(0);
    return parseInt32(value);
}

export function setConfidence(hash: string, value: i32): void {
    fsm.setContextValue(CONFIDENCE_KEY + hash, value.toString());
    setConfidences(hash)
}

export function getConfidences(): string[] {
    const value = fsm.getContextValue(CONFIDENCES_KEY);
    if (value === "") return [];
    return JSON.parse<string[]>(value);
}

export function setConfidences(newhash: string): void {
    const conf = getConfidences();
    conf.push(newhash);
    fsm.setContextValue(CONFIDENCES_KEY, JSON.stringify<string[]>(conf));
}

export function resetConfidences(): void {
    const conf = getConfidences();
    for (let i = 0; i < conf.length; i++) {
        fsm.setContextValue(CONFIDENCE_KEY + conf[i], "");
    }
    fsm.setContextValue(CONFIDENCES_KEY, "");
}

export function getBlocks(): TempBlock[] {
    const value = fsm.getContextValue(BLOCKS_KEY);
    if (value === "") return [];
    return JSON.parse<TempBlock[]>(value);
}

export function setBlocks(block: string, header: string, hash: string): void {
    const value = getBlocks();
    value.push(new TempBlock(block, header, hash));
    fsm.setContextValue(BLOCKS_KEY, JSON.stringify<TempBlock[]>(value));
}

export function resetBlocks(): void {
    const conf = getBlocks();
    fsm.setContextValue(BLOCKS_KEY, "");
}

export function setCurrentNodeId(index: i32): void {
    fsm.setContextValue(CURRENT_NODE_ID, index.toString());
}

export function getNodeCount(): i32 {
    const ips = getNodeIPs();
    return getNodeCountInternal(ips);
}

export function getNodeIPs(): Array<NodeInfo> {
    const valuestr = fsm.getContextValue(NODE_IPS);
    let value: Array<NodeInfo> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<NodeInfo>>(valuestr);
    return value;
}

export function setNodeIPs(ips: Array<NodeInfo>): void {
    const valuestr = JSON.stringify<Array<NodeInfo>>(ips);
    fsm.setContextValue(NODE_IPS, valuestr);
}

function getNodeCountInternal(ips: NodeInfo[]): i32 {
    let count = 0;
    for (let i = 0; i < ips.length; i++) {
        if (ips[i].ip.length > 0) {
            count += 1;
        }
    }
    return count;
}

// temporarily store the entries
export function appendLogEntry(
    entry: LogEntryAggregate,
): void {
    const index = getLastLogIndex() + 1;
    // TODO rollback entries in case of a network split (e.g. entries with higher termId than we have have priority); they must be uncommited
    // and just return if already saved
    if (index > entry.index) {
        LoggerDebug("already appended entry", ["height", entry.index.toString()])
        return;
    }
    if (index !== entry.index) {
        revert(`mismatched index while appending log entry: expected ${index}, found ${entry.index}`);
    }
    setLastLogIndex(index);
    setLogEntryAggregate(entry);
}

export function setLogEntryAggregate(
    entry: LogEntryAggregate,
): void {
    const blockData = encodeBase64(Uint8Array.wrap(String.UTF8.encode(JSON.stringify<wblocks.BlockEntry>(entry.data))))
    const tempEntry = new LogEntry(
        entry.index,
        entry.termId,
        entry.leaderId,
        blockData,
    )
    const data = JSON.stringify<LogEntry>(tempEntry);
    setLogEntry(entry.index, data);
}

export function setLogEntryObj(
    entry: LogEntry,
): void {
    const data = JSON.stringify<LogEntry>(entry);
    setLogEntry(entry.index, data);
}

export function setLogEntry(
    index: i64,
    entry: string,
): void {
    LoggerDebugExtended("setting entry", ["height", index.toString(), "value", entry])
    const key = getLogEntryKey(index);
    fsm.setContextValue(key, entry);
}

// remove the temporary block data
export function removeLogEntry(
    index: i64,
): void {
    const entry = getLogEntryObj(index);
    entry.data = "";
    const data = JSON.stringify<LogEntry>(entry);
    setLogEntry(index, data)
}

export function getLogEntryObj(index: i64): LogEntry {
    const value = getLogEntry(index);
    if (value == "") return new LogEntry(0, 0, 0, "");
    return JSON.parse<LogEntry>(value);
}

export function getLogEntry(
    index: i64,
): string {
    const key = getLogEntryKey(index);
    return fsm.getContextValue(key);
}

export function getLogEntryKey(index: i64): string {
    return "logs_" + index.toString();
}

export function getCurrentNodeId(): i32 {
    const value = fsm.getContextValue(CURRENT_NODE_ID);
    if (value === "") return i32(0);
    return parseInt32(value);
}

export function getRoundsCounter(): i32 {
    const value = fsm.getContextValue(ROUNDS_KEY);
    if (value === "") return i32(0);
    return parseInt32(value);
}

export function setRoundsCounter(value: i32): void {
    fsm.setContextValue(ROUNDS_KEY, value.toString());
}

export function getLastLogIndexKey(): string {
    return "logs_last_index";
}

export function getLastLogIndex(): i64 {
    const key = getLastLogIndexKey();
    const valuestr = fsm.getContextValue(key);
    if (valuestr != "") {
        const value = parseInt(valuestr);
        return i64(value);
    }
    return i64(LOG_START);
}

export function setLastLogIndex(
    value: i64,
): void {
    const key = getLastLogIndexKey();
    LoggerDebug("setting entry count", ["height", value.toString()])
    fsm.setContextValue(key, value.toString());
}

export function getMempool(): Mempool {
    const mempool = fsm.getContextValue(MEMPOOL_KEY);
    if (mempool === "") return  new Mempool(new Array<string>(0), new Array<i32>(0));
    return JSON.parse<Mempool>(mempool);
}

export function setMempool(mempool: Mempool): void {
    fsm.setContextValue(MEMPOOL_KEY, JSON.stringify<Mempool>(mempool));
}

export function getMaxTxBytes(): i64 {
    const value = fsm.getContextValue(MAX_TX_BYTES);
    if (value === "") return i64(0);
    return parseInt64(value);
}

export function setMaxTxBytes(value: i64): void {
    fsm.setContextValue(MAX_TX_BYTES, value.toString());
}

export function getCurrentState(): CurrentState {
    const value = fsm.getContextValue(STATE_KEY);
    // this must be set before we try to read it
    if (value === "") {
        revert("chain init setup was not ran")
    }
    return JSON.parse<CurrentState>(value);
}

export function setCurrentState(value: CurrentState): void {
    fsm.setContextValue(STATE_KEY, JSON.stringify<CurrentState>(value));
}
