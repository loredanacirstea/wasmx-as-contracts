import { JSON } from "json-as";
import * as base64 from "as-base64/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as staking from "wasmx-stake/assembly/types";
import * as level0 from "wasmx-consensus/assembly/level0"
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import * as tnd2 from "wasmx-tendermint-p2p/assembly/actions";
import { LoggerDebug, LoggerDebugExtended, LoggerInfo, revert } from "./utils";
import { callStorage, getCurrentProposer, isValidatorSimpleActive } from "wasmx-tendermint-p2p/assembly/action_utils";
import { callStaking } from "wasmx-tendermint/assembly/actions";
import { getCurrentNodeId, getCurrentState, getTermId, getValidatorNodesInfo, setCurrentState } from "wasmx-tendermint-p2p/assembly/storage";
import { isPrecommitAcceptThreshold, isPrecommitAnyThreshold } from "./action_utils";
import { actionParamsToMap, getParamsOrEventParams } from "xstate-fsm-as/assembly/utils";
import { AppendEntry } from "wasmx-tendermint-p2p/assembly/types";
import { VerifyCommitLightRequest, VerifyCommitLightResponse } from "./types";

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

export function setupNode(
    params: ActionParam[],
    event: EventObject,
): void {
    tnd2.setupNode(params, event);
    const state = getCurrentState();
    // we do this to avoid overlapping chat rooms for level0 chains
    // TODO this should be solved by having unique ids for level0
    // and also add a private setting, to not gossip messages to a chat
    if (state.chain_id == level0.Level0ChainIdFull) {
        state.unique_p2p_id = state.validator_address
    }
    setCurrentState(state);
}

export function setup(
    params: ActionParam[],
    event: EventObject,
): void {
    tnd2.setup(params, event);
    const state = getCurrentState();
    // we do this to avoid overlapping chat rooms for level0 chains
    // TODO this should be solved by having unique ids for level0
    // and also add a private setting, to not gossip messages to a chat
    if (state.chain_id == level0.Level0ChainIdFull) {
        state.unique_p2p_id = state.validator_address
    }
    setCurrentState(state);
}

export function isNextProposer(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const validators = getAllValidatorInfos();
    if (validators.length == 1) {
        const nodes = getValidatorNodesInfo();
        if (nodes.length > validators.length) {
            LoggerInfo("cannot propose block, state is not synced", ["validators", validators.length.toString(), "nodes", nodes.length.toString()])
            return false;
        }
    }
    const proposerIndex = getCurrentProposer();
    const currentNode = getCurrentNodeId();
    return proposerIndex == currentNode;
}

export function ifNextBlockProposal(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no entry found");
    }
    const entryBase64 = ctx.get("entry");
    const entryStr = String.UTF8.decode(base64.decode(entryBase64).buffer);
    let entry: AppendEntry = JSON.parse<AppendEntry>(entryStr);
    if (entry.entries.length == 0) return false;
    const block = entry.entries[0]

    const state = getCurrentState()
    if (state.nextHeight != block.index) return false;

    const validators = getAllValidatorInfos();
    const termId = getTermId();
    const proposerIndex = getNextProposer(validators, termId + 1);
    if (proposerIndex == block.leaderId) return true;
    return false;
}

export function ifPrecommitAnyThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const state = getCurrentState()
    if (state.nextHash == "") {
        return false;
    }
    return isPrecommitAnyThreshold(state.nextHeight, state.nextHash);
}

export function ifPrecommitAcceptThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const state = getCurrentState()
    if (state.nextHash == "") {
        return false;
    }
    return isPrecommitAcceptThreshold(state.nextHeight, state.nextHash);
}

export function setConsensusParams(height: i64, value: typestnd.ConsensusParams | null): void {
    let params = ""
    if (value != null) {
        const valuestr = JSON.stringify<typestnd.ConsensusParams>(value)
        params = base64.encode(Uint8Array.wrap(String.UTF8.encode(valuestr)))
    }
    const calldata = `{"setConsensusParams":{"height":${height},"params":"${params}"}}`
    const resp = callStorage(calldata, false);
    if (resp.success > 0) {
        revert("could not set consensus params: " + resp.data);
    }
}

export function getNextProposer(validators: staking.ValidatorSimple[], termId: i64): i32 {
    let validcount = 0;
    for (let i = 0; i < validators.length; i++) {
        if (isValidatorSimpleActive(validators[i])) {
            validcount += 1;
        }
    }
    return i32(termId % validcount);
}

export function setRoundProposer(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId();
    const currentState = getCurrentState();
    const validators = getAllValidatorInfos()
    const proposerIndex = getNextProposer(validators, termId)
    currentState.proposerIndex = proposerIndex;
    currentState.proposerQueueTermId = termId;
    setCurrentState(currentState);
    LoggerDebug("new proposer set", ["validator_index", proposerIndex.toString(), "termId", termId.toString()])
}

export function getAllValidatorInfos(): staking.ValidatorSimple[] {
    const calldata = `{"GetAllValidatorInfos":{}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0) {
        revert("could not get validators");
    }
    if (resp.data === "") return [];
    LoggerDebugExtended("GetAllValidatorInfos", ["data", resp.data])
    const result = JSON.parse<staking.QueryValidatorInfosResponse>(resp.data);
    return result.validators;
}

export function VerifyCommitLight(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("data")) {
        revert("no data found");
    }
    const dataBase64 = ctx.get("data");
    const dataStr = String.UTF8.decode(base64.decode(dataBase64).buffer);
    let req: VerifyCommitLightRequest = JSON.parse<VerifyCommitLightRequest>(dataStr);

    // TODO verify signatures & calculate voting threshold

    const data = new VerifyCommitLightResponse(true, "");
    wasmx.setFinishData(String.UTF8.encode(JSON.stringify<VerifyCommitLightResponse>(data)));
}
