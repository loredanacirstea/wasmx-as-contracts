import { JSON } from "json-as/assembly";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import { getEmptyPrecommitArray, getEmptyValidatorProposalVoteArray, SignedMsgType, ValidatorCommitVote, ValidatorCommitVoteMap, ValidatorProposalVote, ValidatorProposalVoteMap } from "./types_blockchain";
import { parseInt32 } from "wasmx-utils/assembly/utils";
import { NodeInfo } from "wasmx-p2p/assembly/types";
import { LogEntry, LogEntryAggregate } from "./types";
import { LoggerDebug, LoggerInfo, LoggerError, revert, LoggerDebugExtended } from "./utils";
import * as cfg from "./config";
import { Bech32String } from "wasmx-env/assembly/types";
import { CurrentState } from "wasmx-tendermint/assembly/types_blockchain";

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

export function getValidatorNodeCount(): i32 {
    const ips = getValidatorNodesInfo();
    return getNodeCountInternal(ips);
}

export function getSimpleNodeCount(): i32 {
    const ips = getSimpleNodesInfo();
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
        // replace if termId > entry.termId
        const logentry = getLogEntryObj(entry.index);
        if (logentry.termId < entry.termId) {
            setLogEntryAggregate(entry);
            LoggerInfo("replace existing block proposal", ["height", entry.index.toString(), "termId", entry.termId.toString()])
            return;
        }
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

export function getTermId(): i64 {
    const value = fsm.getContextValue(cfg.TERM_ID);
    if (value === "") return i64(0);
    return parseInt32(value);
}

export function setTermId(value: i64): void {
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

export function getValidatorNodesInfo(): Array<NodeInfo> {
    const valuestr = fsm.getContextValue(cfg.VALIDATOR_NODES_INFO);
    let value: Array<NodeInfo> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<NodeInfo>>(valuestr);
    return value;
}

export function setValidatorNodesInfo(ips: Array<NodeInfo>): void {
    const valuestr = JSON.stringify<Array<NodeInfo>>(ips);
    fsm.setContextValue(cfg.VALIDATOR_NODES_INFO, valuestr);
}

export function getSimpleNodesInfo(): Array<NodeInfo> {
    const valuestr = fsm.getContextValue(cfg.SIMPLE_NODES_INFO);
    let value: Array<NodeInfo> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<NodeInfo>>(valuestr);
    return value;
}

export function setSimpleNodesInfo(ips: Array<NodeInfo>): void {
    const valuestr = JSON.stringify<Array<NodeInfo>>(ips);
    fsm.setContextValue(cfg.SIMPLE_NODES_INFO, valuestr);
}

export function addToPrevoteArray(nodeId: i32, data: ValidatorProposalVote): void {
    const value = getPrevoteArrayMap()
    let arr: ValidatorProposalVote[] = [];
    if (value.map.has(data.index)) {
        arr = value.map.get(data.index)
    } else {
        arr = getEmptyValidatorProposalVoteArray(value.nodeCount, data.index, data.termId, SignedMsgType.SIGNED_MSG_TYPE_PREVOTE);
        // we've received a vote before we entered the new round ourselves, so we initialize the new block precommit array with the validator addresses from an earlier block.
        if (value.map.get(data.index - 1)) {
            const oldarr = value.map.get(data.index - 1);
            for (let i = 0 ; i < arr.length; i++) {
                arr[i].validatorAddress = oldarr[i].validatorAddress;
            }
        }
    }
    arr[nodeId] = data;
    value.map.set(data.index, arr);
    setPrevoteArrayMap(value);
}

export function getPrevoteArray(blockHeight: i64): Array<ValidatorProposalVote> {
    const value = getPrevoteArrayMap()
    if (value.map.has(blockHeight)) {
        return value.map.get(blockHeight)
    }
    return [];
}

export function setPrevoteArray(blockHeight: i64, arr: Array<ValidatorProposalVote>): void {
    const value = getPrevoteArrayMap()
    value.map.set(blockHeight, arr)
    setPrevoteArrayMap(value);
}

export function addToPrecommitArray(nodeId: i32, data: ValidatorCommitVote): void {
    const value = getPrecommitArrayMap()
    let arr: ValidatorCommitVote[] = [];
    if (value.map.has(data.vote.index)) {
        arr = value.map.get(data.vote.index)
    } else {
        arr = getEmptyPrecommitArray(value.nodeCount, data.vote.index, data.vote.termId, SignedMsgType.SIGNED_MSG_TYPE_PRECOMMIT)
        // we've received a vote before we entered the new round ourselves, so we initialize the new block precommit array with the validator addresses from an earlier block.
        if (value.map.get(data.vote.index - 1)) {
            const oldarr = value.map.get(data.vote.index - 1);
            for (let i = 0 ; i < arr.length; i++) {
                arr[i].vote.validatorAddress = oldarr[i].vote.validatorAddress;
            }
        }
    }
    arr[nodeId] = data;
    value.map.set(data.vote.index, arr);
    setPrecommitArrayMap(value);
}

export function resetPrecommitArray(blockHeight: i64, newtermId: i64): void {
    const value = getPrecommitArrayMap()
    if (value.map.has(blockHeight)) {
        const arr = value.map.get(blockHeight)
        for (let i = 0 ; i < arr.length; i++) {
            arr[i].signature = ""
            arr[i].block_id_flag = typestnd.BlockIDFlag.Absent
            arr[i].vote.termId = newtermId
            arr[i].vote.hash = "" // empty
        }
        setPrecommitArray(blockHeight, arr)
    }
}

export function getPrecommitArray(blockHeight: i64): Array<ValidatorCommitVote> {
    const value = getPrecommitArrayMap()
    if (value.map.has(blockHeight)) {
        return value.map.get(blockHeight)
    }
    return [];
}

export function setPrecommitArray(blockHeight: i64, arr: Array<ValidatorCommitVote>): void {
    const value = getPrecommitArrayMap()
    value.map.set(blockHeight, arr)
    setPrecommitArrayMap(value);
}

export function getPrevoteArrayMap(): ValidatorProposalVoteMap {
    const valuestr = fsm.getContextValue(cfg.PREVOTE_ARRAY);
    let value: ValidatorProposalVoteMap = new ValidatorProposalVoteMap(0);
    if (valuestr === "") return value;
    value = JSON.parse<ValidatorProposalVoteMap>(valuestr);
    return value;
}

export function setPrevoteArrayMap(value: ValidatorProposalVoteMap): void {
    fsm.setContextValue(cfg.PREVOTE_ARRAY, JSON.stringify<ValidatorProposalVoteMap>(value));
}

export function getPrecommitArrayMap(): ValidatorCommitVoteMap {
    const valuestr = fsm.getContextValue(cfg.PRECOMMIT_ARRAY);
    let value: ValidatorCommitVoteMap = new ValidatorCommitVoteMap(0);
    if (valuestr === "") return value;
    value = JSON.parse<ValidatorCommitVoteMap>(valuestr);
    return value;
}

export function setPrecommitArrayMap(value: ValidatorCommitVoteMap): void {
    fsm.setContextValue(cfg.PRECOMMIT_ARRAY, JSON.stringify<ValidatorCommitVoteMap>(value));
}

// last log may be an uncommited one or a final one
export function getLastLog(): LogEntry {
    const index = getLastLogIndex();
    return getLogEntryObj(index);
}
