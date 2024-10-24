import { JSON } from "json-as/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import * as fsm from 'xstate-fsm-as/assembly/storage';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import { CurrentState, GetProposerResponse } from "./types_blockchain";
import { base64ToHex, parseInt32 } from "wasmx-utils/assembly/utils";
import { LogEntry, LogEntryAggregate } from "./types";
import { LoggerDebug, LoggerInfo, LoggerError, revert, LoggerDebugExtended } from "./utils";
import * as cfg from "./config";
import { Base64String, SignedTransaction } from "wasmx-env/assembly/types";
import { NodeInfo } from "wasmx-p2p/assembly/types";

export function getBlockID(hash: Base64String): typestnd.BlockID {
    const hexhash = base64ToHex(hash)
    return new typestnd.BlockID(hexhash, new typestnd.PartSetHeader(1, hexhash))
}

export function getBlockIDProto(hash: Base64String): typestnd.BlockIDProto {
    return new typestnd.BlockIDProto(hash, new typestnd.PartSetHeader(1, hash))
}

export function getCurrentState(): CurrentState {
    const value = fsm.getContextValue(cfg.STATE_KEY);
    // this must be set before we try to read it
    if (value === "") {
        revert("chain init setup was not ran")
    }
    return JSON.parse<CurrentState>(value);
}

export function setCurrentState(value: CurrentState): void {
    fsm.setContextValue(cfg.STATE_KEY, JSON.stringify<CurrentState>(value));
}

export function getCurrentNodeId(): i32 {
    const value = fsm.getContextValue(cfg.CURRENT_NODE_ID);
    if (value === "") return i32(0);
    return parseInt32(value);
}

export function getNodeCount(): i32 {
    const ips = getNodeIPs();
    return getNodeCountInternal(ips);
}

export function getCurrentValidator(): typestnd.ValidatorInfo {
    const currentState = getCurrentState();
    // TODO voting_power & proposer_priority
    return new typestnd.ValidatorInfo(currentState.validator_address, currentState.validator_pubkey, 0, 0);
}

export function getNodeCountInternal(ips: NodeInfo[]): i32 {
    let count = 0;
    for (let i = 0; i < ips.length; i++) {
        if (ips[i].node.ip.length > 0) {
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

export function getTermId(): i32 {
    const value = fsm.getContextValue(cfg.TERM_ID);
    if (value === "") return i32(0);
    return parseInt32(value);
}

export function setTermId(value: i32): void {
    fsm.setContextValue(cfg.TERM_ID, value.toString());
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
    return i64(cfg.LOG_START);
}

export function setLastLogIndex(
    value: i64,
): void {
    const key = getLastLogIndexKey();
    LoggerDebug("setting entry count", ["height", value.toString()])
    fsm.setContextValue(key, value.toString());
}

export function getNodeIPs(): Array<NodeInfo> {
    const valuestr = fsm.getContextValue(cfg.NODE_IPS);
    let value: Array<NodeInfo> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<NodeInfo>>(valuestr);
    return value;
}

export function setNodeIPs(ips: Array<NodeInfo>): void {
    const valuestr = JSON.stringify<Array<NodeInfo>>(ips);
    fsm.setContextValue(cfg.NODE_IPS, valuestr);
}

export function getNextIndexArray(): Array<i64> {
    const valuestr = fsm.getContextValue(cfg.NEXT_INDEX_ARRAY);
    let value: Array<i64> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<i64>>(valuestr);
    return value;
}

export function setNextIndexArray(arr: Array<i64>): void {
    fsm.setContextValue(cfg.NEXT_INDEX_ARRAY, JSON.stringify<Array<i64>>(arr));
}

// last log may be an uncommited one or a final one
export function getLastLog(): LogEntry {
    const index = getLastLogIndex();
    return getLogEntryObj(index);
}

export function decodeTx(tx: Base64String): SignedTransaction {
    return wasmxw.decodeCosmosTxToJson(decodeBase64(tx).buffer);
}
