import { JSON } from "json-as/assembly";
import { decode as decodeBase64, encode as encodeBase64 } from "as-base64/assembly";
import { ActionParam, EventObject } from "xstate-fsm-as/assembly/types";
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as wblocks from "wasmx-blocks/assembly/types";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as staking from "wasmx-stake/assembly/types";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import { callHookContract, getNextProposer, getTotalStaked, updateConsensusParams, updateValidators } from "wasmx-tendermint/assembly/actions";
import * as cfg from "./config";
import { AppendEntry, LogEntryAggregate } from "./types";
import { LoggerDebug, LoggerError, LoggerInfo, revert } from "./utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { getCurrentNodeId, getCurrentState, getLastLogIndex, getLogEntryObj, getPrecommitArray, getPrevoteArray, getTermId, getValidatorNodeCount, getValidatorNodesInfo, removeLogEntry, setCurrentState, setPrecommitArray, setPrevoteArray } from "./storage";
import { getAllValidators, signMessage } from "wasmx-raft/assembly/action_utils";
import { CurrentState, ValidatorProposalVote } from "./types_blockchain";
import { Base64String, Bech32String, CallRequest, CallResponse } from "wasmx-env/assembly/types";
import { LOG_START } from "./config";
import { NodeInfo } from "wasmx-raft/assembly/types_raft";
import { base64ToHex, parseUint8ArrayToU32BigEndian, uint8ArrayToHex } from "wasmx-utils/assembly/utils";
import { extractIndexedTopics, getCommitHash, getResultsHash } from "wasmx-consensus-utils/assembly/utils";

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

export function extractAppendEntry(
    params: ActionParam[],
    event: EventObject,
): AppendEntry {
    let entryBase64: string = "";
    for (let i = 0; i < event.params.length; i++) {
        if (event.params[i].key === "entry") {
            entryBase64 = event.params[i].value;
            continue;
        }
    }
    if (entryBase64 === "") {
        revert("update node: empty entry");
    }
    const entryStr = String.UTF8.decode(decodeBase64(entryBase64).buffer);
    let entry: AppendEntry = JSON.parse<AppendEntry>(entryStr);
    return entry
}

export function getLogEntryAggregate(index: i64): LogEntryAggregate {
    const value = getLogEntryObj(index);
    let data = value.data;
    if (data != "") {
        data = String.UTF8.decode(decodeBase64(data).buffer);
    } else {
        data = getFinalBlock(index);
    }
    const blockData = JSON.parse<wblocks.BlockEntry>(data);
    const entry = new LogEntryAggregate(
        value.index,
        value.termId,
        value.leaderId,
        blockData,
    )
    return entry;
}


export function initChain(req: typestnd.InitChainSetup): void {
    LoggerDebug("start chain init", [])

    // TODO what are the correct empty valuew?
    // we need a non-empty string value, because we use this to compute next proposer
    const emptyBlockId = new typestnd.BlockID(req.app_hash, new typestnd.PartSetHeader(0, ""))
    const last_commit_hash = ""
    const currentState = new CurrentState(
        req.chain_id,
        req.version,
        req.app_hash,
        emptyBlockId,
        last_commit_hash,
        req.last_results_hash,
        req.validator_address,
        req.validator_privkey,
        req.validator_pubkey,
        LOG_START + 1, "", 0, 0, 0, 0,
    );

    const valuestr = JSON.stringify<CurrentState>(currentState);
    LoggerDebug("set current state", ["state", valuestr])
    setCurrentState(currentState);
    setConsensusParams(req.consensus_params);
    LoggerDebug("current state set", [])
}


export function setConsensusParams(value: typestnd.ConsensusParams): void {
    const valuestr = JSON.stringify<typestnd.ConsensusParams>(value)
    const calldata = `{"setConsensusParams":{"params":"${encodeBase64(Uint8Array.wrap(String.UTF8.encode(valuestr)))}"}}`
    const resp = callStorage(calldata, false);
    if (resp.success > 0) {
        revert("could not set consensus params");
    }
}

export function getConsensusParams(): typestnd.ConsensusParams {
    const calldata = `{"getConsensusParams":{}}`
    const resp = callStorage(calldata, true);
    if (resp.success > 0) {
        revert("could not get consensus params");
    }
    if (resp.data === "") return new typestnd.ConsensusParams(
        new typestnd.BlockParams(0, 0),
        new typestnd.EvidenceParams(0, 0, 0),
        new typestnd.ValidatorParams([]),
        new typestnd.VersionParams(0),
        new typestnd.ABCIParams(0),
    );
    return JSON.parse<typestnd.ConsensusParams>(resp.data);
}

export function callStorage(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest("storage", calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, cfg.MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function isNodeActive(node: NodeInfo): bool {
    return !node.outofsync && (node.node.ip != "" || node.node.host != "")
}

export function prepareAppendEntry(index: i64): AppendEntry {
    const entry = getLogEntryAggregate(index);
    const data = new AppendEntry(
        getTermId(),
        getCurrentNodeId(),
        [entry],
    )
    return data;
}

export function prepareAppendEntryMessage(
    data: AppendEntry,
): string {
    const datastr = JSON.stringify<AppendEntry>(data);
    const signature = signMessage(datastr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveBlockProposal","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    return msgstr
}

export function calculateCurrentProposer(validators: staking.Validator[]): i32 {
    const currentState = getCurrentState();
    const totalStaked = getTotalStaked(validators);
    const proposerIndex = getNextProposer(currentState.last_block_id.hash, totalStaked, validators);
    return proposerIndex
}

export function isPrevoteAnyThreshold(): boolean {
    const prevoteArr = getPrevoteArray();
    return calculateVote(prevoteArr, "")
}

export function isPrevoteAcceptThreshold(hash: string): boolean {
    const prevoteArr = getPrevoteArray();
    return calculateVote(prevoteArr, hash)
}

export function isPrecommitAnyThreshold(): boolean {
    const precommitArr = getPrecommitArray();
    return calculateVote(precommitArr, "")
}

export function isPrecommitAcceptThreshold(hash: string): boolean {
    const precommitArr = getPrecommitArray();
    return calculateVote(precommitArr, hash)
}

export function calculateVote(votePerNode: Array<ValidatorProposalVote>, hash: string): boolean {
    const validators = getAllValidators();
    let totalStake = getTotalStaked(validators)
    const threshold = getBFTThreshold(totalStake);
    // calculate voting stake for the proposed block
    let count: BigInt = BigInt.zero();
    for (let i = 0; i < votePerNode.length; i++) {
        if (hash == "") { // any vote
            if (votePerNode[i].hash != "") {
                // @ts-ignore
                count += validators[i].tokens;
            }
        } else if (votePerNode[i].hash == hash) {
            // @ts-ignore
            count += validators[i].tokens;
        }
    }
    // @ts-ignore
    const committing = count >= threshold;
    return committing;
}

function getBFTThreshold(totalState: BigInt): BigInt {
    return totalState.mul(BigInt.fromU32(2)).div(BigInt.fromU32(3)).add(BigInt.fromU32(1))
}

export function startBlockFinalizationFollower(index: i64): boolean {
    // get entry and apply it
    const entryobj = getLogEntryAggregate(index);
    return startBlockFinalizationFollowerInternal(entryobj)
}

export function startBlockFinalizationFollowerInternal(entryobj: LogEntryAggregate): boolean {
    LoggerInfo("start block finalization", ["height", entryobj.index.toString()])
    LoggerDebug("start block finalization", ["height", entryobj.index.toString(), "proposerId", entryobj.leaderId.toString(), "termId", entryobj.termId.toString(), "data", JSON.stringify<wblocks.BlockEntry>(entryobj.data)])
    return startBlockFinalizationInternal(entryobj, false);
}

// TODO CommitInfo saved in block! from voting process
function startBlockFinalizationInternal(entryobj: LogEntryAggregate, retry: boolean): boolean {
    const processReqStr = String.UTF8.decode(decodeBase64(entryobj.data.data).buffer);
    const processReq = JSON.parse<typestnd.RequestProcessProposal>(processReqStr);
    const finalizeReq = new typestnd.RequestFinalizeBlock(
        processReq.txs,
        processReq.proposed_last_commit,
        processReq.misbehavior,
        processReq.hash,
        processReq.height,
        processReq.time,
        processReq.next_validators_hash,
        processReq.proposer_address,
    )
    let respWrap = consensuswrap.FinalizeBlock(finalizeReq);
    if (respWrap.error.length > 0 && !retry) {
        // ERR invalid height: 3232; expected: 3233
        const mismatchErr = `expected: ${(finalizeReq.height + 1).toString()}`
        if (respWrap.error.includes("invalid height") && respWrap.error.includes(mismatchErr)) {
            const rollbackHeight = finalizeReq.height - 1;
            LoggerInfo(`trying to rollback`, ["height", rollbackHeight.toString()])
            const err = consensuswrap.RollbackToVersion(rollbackHeight);
            if (err.length > 0) {
                revert(`consensus break: ${respWrap.error}; ${err}`);
                return false;
            }
            // repeat FinalizeBlock
            return startBlockFinalizationInternal(entryobj, true);
        } else {
            revert(respWrap.error)
            return false;
        }
    }
    const finalizeResp = respWrap.data;
    if (finalizeResp == null) {
        revert("FinalizeBlock response is null");
        return false;
    }

    const resultstr = JSON.stringify<typestnd.ResponseFinalizeBlock>(finalizeResp);
    const resultBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(resultstr)));

    entryobj.data.result = resultBase64;

    const commitBz = String.UTF8.decode(decodeBase64(entryobj.data.commit).buffer);
    const commit = JSON.parse<typestnd.BlockCommit>(commitBz);

    const last_commit_hash = getCommitHash(commit);
    const last_results_hash = getResultsHash(finalizeResp.tx_results);

    // update current state
    LoggerDebug("updating current state...", [])
    const state = getCurrentState();
    state.app_hash = finalizeResp.app_hash;
    state.last_block_id = new typestnd.BlockID(
        base64ToHex(finalizeReq.hash),
        new typestnd.PartSetHeader(0, base64ToHex(finalizeReq.hash.slice(0, 8)))
    );
    state.last_commit_hash = last_commit_hash
    state.last_results_hash = last_results_hash
    state.nextHeight = finalizeReq.height + 1
    setCurrentState(state);
    // update consensus params
    LoggerDebug("updating consensus parameters...", [])
    updateConsensusParams(finalizeResp.consensus_param_updates);
    // update validator info
    LoggerDebug("updating validator info...", [])
    updateValidators(finalizeResp.validator_updates);

    // ! make all state changes before the commit

    // save final block
    const txhashes: string[] = [];
    for (let i = 0; i < finalizeReq.txs.length; i++) {
        const hash = wasmxw.sha256(finalizeReq.txs[i]);
        txhashes.push(hash);
    }

    const blockData = JSON.stringify<wblocks.BlockEntry>(entryobj.data)
    // also indexes transactions
    // index events: eventTopic => txhash[]
    const indexedTopics = extractIndexedTopics(finalizeResp, txhashes)
    setFinalizedBlock(blockData, finalizeReq.hash, txhashes, indexedTopics);

    // remove temporary block data
    removeLogEntry(entryobj.index);

    // before commiting, we check if consensus contract was changed
    let newContract = "";
    let newLabel = "";
    let roleConsensus = false;
    let evs = finalizeResp.events
    for (let i = 0; i < finalizeResp.tx_results.length; i++) {
        evs = evs.concat(finalizeResp.tx_results[i].events)
    }
    for (let i = 0; i < evs.length; i++) {
        const ev = evs[i];
        if (ev.type == "register_role") {
            for (let j = 0; j < ev.attributes.length; j++) {
                if (ev.attributes[j].key == "role") {
                    roleConsensus = ev.attributes[j].value == "consensus"
                }
                if (ev.attributes[j].key == "contract_address") {
                    newContract = ev.attributes[j].value;
                }
                if (ev.attributes[j].key == "role_label") {
                    newLabel = ev.attributes[j].value;
                }
            }
            if (roleConsensus) {
                LoggerInfo("found new consensus contract", ["address", newContract, "label", newLabel])
                break;
            } else {
                newContract = ""
                newLabel = ""
            }
        }
    }

    // execute hooks if there is no consensus change
    // this must be ran from the new contract
    if (newContract == "") {
        callHookContract("EndBlock", blockData);
    }

    // we have finalized and saved the new block
    // so we can execute setup on the new contract
    // this way, the delay of the timed action that starts the new consensus fsm is minimal.
    let newContractSetup = false;
    if (newContract !== "") {
        const myaddress = wasmxw.addr_humanize(wasmx.getAddress());
        LoggerInfo("setting up next consensus contract", ["new contract", newContract, "previous contract", myaddress])
        let calldata = `{"run":{"event":{"type":"setup","params":[{"key":"address","value":"${myaddress}"}]}}}`
        let req = new CallRequest(newContract, calldata, BigInt.zero(), 100000000, false);
        let resp = wasmxw.call(req, cfg.MODULE_NAME);
        if (resp.success > 0) {
            LoggerError("cannot setup next consensus contract", ["new contract", newContract, "err", resp.data]);
        } else {
            LoggerInfo("next consensus contract is set", ["new contract", newContract])
            newContractSetup = true;

            // stop this contract and any intervals on this contract
            // TODO cancel all intervals on stop() action
            calldata = `{"run":{"event":{"type":"stop","params":[]}}}`
            req = new CallRequest(myaddress, calldata, BigInt.zero(), 100000000, false);
            resp = wasmxw.call(req, cfg.MODULE_NAME);
            if (resp.success > 0) {
                LoggerError("cannot stop previous consensus contract", ["err", resp.data]);
                // TODO what now?
            } else {
                LoggerInfo("stopped current consensus contract", [])
            }
        }
    }

    const commitResponse = consensuswrap.Commit();
    // TODO commitResponse.retainHeight
    // Tendermint removes all data for heights lower than `retain_height`
    LoggerInfo("block finalized", ["height", entryobj.index.toString(), "termId", entryobj.termId.toString()])

    // TODO if we cannot start with the new contract, maybe we should remove its consensus role

    // if consensus changed, start the new contract
    if (newContract != "" && newContractSetup) {
        LoggerInfo("starting new consensus contract", ["address", newContract])
        let calldata = `{"run":{"event":{"type":"prestart","params":[]}}}`
        let req = new CallRequest(newContract, calldata, BigInt.zero(), 100000000, false);
        let resp = wasmxw.call(req, cfg.MODULE_NAME);
        if (resp.success > 0) {
            LoggerError("cannot start next consensus contract", ["new contract", newContract, "err", resp.data]);
            // we can restart the old contract here, so the chain does not stop
            const myaddress = wasmxw.addr_humanize(wasmx.getAddress());
            calldata = `{"run":{"event":{"type":"restart","params":[]}}}`
            req = new CallRequest(myaddress, calldata, BigInt.zero(), 100000000, false);
            resp = wasmxw.call(req, cfg.MODULE_NAME);
            if (resp.success > 0) {
                LoggerError("cannot restart previous consensus contract", ["err", resp.data]);
            } else {
                LoggerInfo("restarted current consensus contract", [])
            }
        } else {
            LoggerInfo("next consensus contract is started", ["new contract", newContract])
            // consensus changed
            return true;
        }
    }
    return false;
}

export function getLastBlockIndex(): i64 {
    const calldatastr = `{"getLastBlockIndex":{}}`;
    const resp = callStorage(calldatastr, false);
    if (resp.success > 0) {
        revert(`could not get last block index`);
    }
    const res = JSON.parse<wblockscalld.LastBlockIndexResult>(resp.data);
    return res.index;
}

export function getFinalBlock(index: i64): string {
    const calldata = new wblockscalld.CallDataGetBlockByIndex(index);
    const calldatastr = `{"getBlockByIndex":${JSON.stringify<wblockscalld.CallDataGetBlockByIndex>(calldata)}}`;
    const resp = callStorage(calldatastr, false);
    if (resp.success > 0) {
        revert(`could not get finalized block: ${index.toString()}`);
    }
    return resp.data;
}

export function setFinalizedBlock(blockData: string, hash: string, txhashes: string[], indexedTopics: wblockscalld.IndexedTopic[]): void {
    const calldata = new wblockscalld.CallDataSetBlock(blockData, hash, txhashes, indexedTopics);
    const calldatastr = `{"setBlock":${JSON.stringify<wblockscalld.CallDataSetBlock>(calldata)}}`;
    const resp = callStorage(calldatastr, false);
    if (resp.success > 0) {
        revert(`could not set finalized block: ${resp.data}`);
    }
}

export function getSelfNodeInfo(): NodeInfo {
    const nodeIps = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    return nodeIps[ourId];
}
