import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as roles from "wasmx-env/assembly/roles";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import { base64ToHex } from "wasmx-utils/assembly/utils";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as staking from "wasmx-stake/assembly/types";
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as mcwrap from 'wasmx-consensus/assembly/multichain_wrap';
import { StartSubChainMsg } from "wasmx-consensus/assembly/types_multichain";
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import { LoggerDebug, LoggerError, LoggerInfo, revert } from "./utils";
import { LOG_START } from "./config";
import { callStorage, getCurrentProposer, isValidatorSimpleActive } from "wasmx-tendermint-p2p/assembly/action_utils";
import { callContract, callStaking } from "wasmx-tendermint/assembly/actions";
import { InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import { QuerySubChainIdsResponse } from "wasmx-multichain-registry-local/assembly/types";
import { getCurrentNodeId, getCurrentState, getTermId, getValidatorNodesInfo, setCurrentState, setValidatorNodesInfo } from "wasmx-tendermint-p2p/assembly/storage";
import { isPrecommitAcceptThreshold, isPrecommitAnyThreshold } from "./action_utils";
import { CurrentState } from "wasmx-tendermint-p2p/assembly/types_blockchain";

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
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

export function ifPrecommitAnyThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return isPrecommitAnyThreshold(getCurrentState().nextHeight);
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
        revert("could not set consensus params");
    }
}

export function setRoundProposer(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId();
    const currentState = getCurrentState();
    const validators = getAllValidatorInfos()
    let validcount = 0;
    for (let i = 0; i < validators.length; i++) {
        if (isValidatorSimpleActive(validators[i])) {
            validcount += 1;
        }
    }
    const proposerIndex = termId % validcount;
    currentState.proposerIndex = i32(proposerIndex);
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
    LoggerDebug("GetAllValidatorInfos", ["data", resp.data])
    const result = JSON.parse<staking.QueryValidatorInfosResponse>(resp.data);
    return result.validators;
}
