import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64, encode } from "as-base64/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { LoggerDebug, LoggerInfo, LoggerError, revert } from "./utils";
import {
  Base64String,
  CallRequest,
  CallResponse,
} from 'wasmx-env/assembly/types';
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { CurrentState, Mempool } from "./types_blockchain";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { hexToUint8Array, parseInt32, parseInt64, uint8ArrayToHex, i64ToUint8ArrayBE } from "wasmx-utils/assembly/utils";
import { base64ToHex, hex64ToBase64 } from './utils';
import { LogEntry, LogEntryAggregate, TransactionResponse, AppendEntry, AppendEntryResponse, VoteResponse, VoteRequest, NodeUpdate, UpdateNodeResponse } from "./types_raft";
import {STATE_KEY} from "./config";

export function getStorageAddress(): string {
    const state = getCurrentState();
    return state.wasmx_blocks_contract;
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

export function getElectionTimeout(): i64 {
    const value = fsm.getContextValue(ELECTION_TIMEOUT_KEY);
    if (value === "") return i64(0);
    return parseInt64(value);
}

export function setElectionTimeout(value: i64): void {
    fsm.setContextValue(ELECTION_TIMEOUT_KEY, value.toString());
}

function getNodeCount(): i32 {
    const ips = getNodeIPs();
    return getNodeCountInternal(ips);
}

function getNodeCountInternal(ips: string[]): i32 {
    let count = 0;
    for (let i = 0; i < ips.length; i++) {
        if (ips[i].length > 0) {
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
    LoggerDebug("setting entry", ["height", index.toString(), "value", entry.slice(0, MAX_LOGGED) + " [...]"])
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

export function getLogEntryKey(index: i64): string {
    return "logs_" + index.toString();
}

export function getLastLogIndexKey(): string {
    return "logs_last_index";
}

function getTermId(): i32 {
    const value = fsm.getContextValue(TERM_ID);
    if (value === "") return i32(0);
    return parseInt32(value);
}

function setTermId(value: i32): void {
    fsm.setContextValue(TERM_ID, value.toString());
}

// function getVotedFor(): i32 {
//     const value = getVotedForInternal();
//     if (value > 0) {
//         return value - 1;
//     }
//     return value;
// }

function hasVotedFor(): boolean {
    return getVotedForInternal() > 0;
}

function getVotedForInternal(): i32 {
    const value = fsm.getContextValue(VOTED_FOR_KEY);
    if (value === "") return i32(0);
    return parseInt32(value);
}

function setVotedFor(value: i32): void {
    setVotedForInternal(value + 1);
}

function setVotedForInternal(value: i32): void {
    fsm.setContextValue(VOTED_FOR_KEY, value.toString());
}

function getCurrentNodeId(): i32 {
    const value = fsm.getContextValue(CURRENT_NODE_ID);
    if (value === "") return i32(0);
    return parseInt32(value);
}

function setCurrentNodeId(index: i32): void {
    fsm.setContextValue(CURRENT_NODE_ID, index.toString());
}

function getLastApplied(): i64 {
    const value = fsm.getContextValue(LAST_APPLIED);
    if (value === "") return i64(LOG_START);
    return parseInt64(value);
}

function setLastApplied(value: i64): void {
    fsm.setContextValue(LAST_APPLIED, value.toString());
}

function getCommitIndex(): i64 {
    const value = fsm.getContextValue(COMMIT_INDEX);
    if (value === "") return i64(LOG_START);
    return parseInt64(value);
}

function setCommitIndex(index: i64): void {
    fsm.setContextValue(COMMIT_INDEX, index.toString());
}

function getMatchIndexArray(): Array<i64> {
    const valuestr = fsm.getContextValue(MATCH_INDEX_ARRAY);
    let value: Array<i64> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<i64>>(valuestr);
    return value;
}

function setMatchIndexArray(value: Array<i64>): void {
    fsm.setContextValue(MATCH_INDEX_ARRAY, JSON.stringify<Array<i64>>(value));
}

function getNodeIPs(): Array<string> {
    const valuestr = fsm.getContextValue(NODE_IPS);
    let value: Array<string> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<string>>(valuestr);
    return value;
}

function setNodeIPs(ips: Array<string>): void {
    const valuestr = JSON.stringify<Array<string>>(ips);
    fsm.setContextValue(NODE_IPS, valuestr);
}

function getNextIndexArray(): Array<i64> {
    const valuestr = fsm.getContextValue(NEXT_INDEX_ARRAY);
    let value: Array<i64> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<i64>>(valuestr);
    return value;
}

function setNextIndexArray(arr: Array<i64>): void {
    fsm.setContextValue(NEXT_INDEX_ARRAY, JSON.stringify<Array<i64>>(arr));
}

function getVoteIndexArray(): Array<i32> {
    const valuestr = fsm.getContextValue(VOTE_INDEX_ARRAY);
    let value: Array<i32> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<i32>>(valuestr);
    return value;
}

function setVoteIndexArray(arr: Array<i32>): void {
    fsm.setContextValue(VOTE_INDEX_ARRAY, JSON.stringify<Array<i32>>(arr));
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

export function getValidators(): typestnd.ValidatorInfo[] {
    const value = fsm.getContextValue(VALIDATORS_KEY);
    if (value === "") return [];
    return JSON.parse<typestnd.ValidatorInfo[]>(value);
}

export function setValidators(value: typestnd.ValidatorInfo[]): void {
    fsm.setContextValue(VALIDATORS_KEY, JSON.stringify<typestnd.ValidatorInfo[]>(value));
}

export function updateValidators(updates: typestnd.ValidatorUpdate[]): void {
    const validators = getValidators();
    for (let i = 0; i < updates.length; i++) {
        for (let j = 0; j < validators.length; j++) {
            if (validators[j].pub_key == updates[i].pub_key) {
                validators[j].voting_power = updates[i].power;
            }
        }
    }
    setValidators(validators);
}
