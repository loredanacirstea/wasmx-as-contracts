import { JSON } from "json-as/assembly";
import { decode as decodeBase64, encode as encodeBase64 } from "as-base64/assembly";
import * as base64 from "as-base64/assembly"
import { ActionParam, EventObject, ExternalActionCallData } from "xstate-fsm-as/assembly/types";
import * as hooks from "wasmx-env/assembly/hooks";
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as wblocks from "wasmx-blocks/assembly/types";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as consutil from "wasmx-consensus/assembly/utils";
import * as staking from "wasmx-stake/assembly/types";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as modnames from "wasmx-env/assembly/modules";
import * as mctypes from "wasmx-consensus/assembly/types_multichain";
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as tnd from "wasmx-tendermint/assembly/actions";
import { callContract, callHookContract, callHookNonCContract, getMempool, setMempool, updateConsensusParams, updateValidators } from "wasmx-tendermint/assembly/actions";
import * as cfg from "./config";
import { AppendEntry, CosmosmodGenesisState, IsNodeValidator, LogEntryAggregate } from "./types";
import { LoggerDebug, LoggerError, LoggerInfo, revert } from "./utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { getCurrentNodeId, getCurrentState, getLogEntryObj, getPrecommitArray, getPrevoteArray, getTermId, getValidatorNodesInfo, removeLogEntry, setCurrentState, setTermId, setValidatorNodesInfo } from "./storage";
import { getAllValidators, signMessage } from "wasmx-raft/assembly/action_utils";
import { NodeInfo, NodeInfoResponse } from "wasmx-p2p/assembly/types";
import { GetProposerResponse, ValidatorProposalVote } from "./types_blockchain";
import { Base64String, Bech32String, CallRequest, CallResponse, HexString, SignedTransaction } from "wasmx-env/assembly/types";
import { LOG_START } from "./config";
import { base64ToHex, base64ToString } from "wasmx-utils/assembly/utils";
import { extractIndexedTopics, getCommitHash, getResultsHash } from "wasmx-consensus-utils/assembly/utils";
import * as stakingutils from "wasmx-stake/assembly/msg_utils";
import { decodeTx, getBlockID, getBlockIDProto } from "wasmx-tendermint/assembly/action_utils";
import * as raftp2pactions from "wasmx-raft-p2p/assembly/actions";
import { NodeUpdate } from "wasmx-raft/assembly/types_raft";
import { removeNode } from "wasmx-raft/assembly/actions";
import { CurrentState, ValidatorQueueEntry } from "wasmx-tendermint/assembly/types_blockchain";

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

export function getLogEntryAggregate(index: i64): LogEntryAggregate | null {
    const value = getLogEntryObj(index);
    let data = value.data;
    if (data != "") {
        data = String.UTF8.decode(decodeBase64(data).buffer);
    } else {
        data = getFinalBlock(index);
    }
    if (data == "") return null;
    const blockData = JSON.parse<wblocks.BlockEntry>(data);
    const entry = new LogEntryAggregate(
        value.index,
        value.termId,
        value.leaderId,
        blockData,
    )
    return entry;
}

export function getTendermintVote(data: ValidatorProposalVote): typestnd.VoteTendermint {
    let hash = data.hash
    // cometbft expects hash: []byte => nil is []byte{}
    if (hash == "nil") {
        hash = ""
    }
    return new typestnd.VoteTendermint(
        data.type,
        data.index,
        data.termId,
        getBlockIDProto(hash),
        data.timestamp,
        encodeBase64(Uint8Array.wrap(wasmxw.addr_canonicalize(data.validatorAddress))),
        data.validatorIndex,
    )
}

export function initChain(req: typestnd.InitChainSetup): void {
    LoggerDebug("start chain init", [])

    // TODO what are the correct empty valuew?
    // we need a non-empty string value, because we use this to compute next proposer
    const emptyBlockId = new typestnd.BlockID(base64ToHex(req.app_hash), new typestnd.PartSetHeader(0, ""))
    const last_commit_hash = ""
    const currentState = new CurrentState(
        req.chain_id,
        req.version,
        req.app_hash,
        emptyBlockId,
        last_commit_hash,
        req.last_results_hash,
        0, [],
        new Date(0).toISOString(),
        req.validator_address,
        req.validator_privkey,
        req.validator_pubkey,
        LOG_START + 1, "", 0, 0, 0, 0,
        [], 0, 0,
    );

    const valuestr = JSON.stringify<CurrentState>(currentState);
    LoggerDebug("set current state", ["state", valuestr])
    setCurrentState(currentState);
    setConsensusParams(LOG_START + 1, req.consensus_params);
    LoggerDebug("current state set", [])
}

export function storageBootstrapAfterStateSync(height: i64, lastHeightChanged: i64, value: typestnd.ConsensusParams): void {
    const valuestr = JSON.stringify<typestnd.ConsensusParams>(value)
    const params = encodeBase64(Uint8Array.wrap(String.UTF8.encode(valuestr)))
    const calldata = `{"bootstrapAfterStateSync":{"last_block_height":${height},"last_height_changed":${lastHeightChanged},"params":"${params}"}}`
    const resp = callStorage(calldata, false);
    if (resp.success > 0) {
        revert("could not bootstrap storage");
    }
}

export function setConsensusParams(height: i64, value: typestnd.ConsensusParams | null): void {
    let params = ""
    if (value != null) {
        const valuestr = JSON.stringify<typestnd.ConsensusParams>(value)
        params = encodeBase64(Uint8Array.wrap(String.UTF8.encode(valuestr)))
    }
    const calldata = `{"setConsensusParams":{"height":${height},"params":"${params}"}}`
    const resp = callStorage(calldata, false);
    if (resp.success > 0) {
        revert("could not set consensus params");
    }
}

export function getConsensusParams(height: i64): typestnd.ConsensusParams {
    const calldata = `{"getConsensusParams":{"height":${height}}}`
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

export function prepareAppendEntry(index: i64): AppendEntry | null {
    const data = new AppendEntry(
        getTermId(),
        getCurrentNodeId(),
        [],
    )
    const entry = getLogEntryAggregate(index);
    if (entry == null) {
        return null
    }
    data.entries.push(entry);
    return data;
}

export function prepareAppendEntryMessage(
    data: AppendEntry,
): string {
    const datastr = JSON.stringify<AppendEntry>(data);
    const signature = signMessage(datastr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const senderaddr = getSelfNodeInfo().address
    const msgstr = `{"run":{"event":{"type":"receiveBlockProposal","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"},{"key": "sender","value":"${senderaddr}"}]}}}`
    return msgstr
}

export function isPrevoteAnyThreshold(blockHeight: i64, hash: string): boolean {
    const prevoteArr = getPrevoteArray(blockHeight);
    return calculateVote(prevoteArr, hash, true)
}

export function isPrevoteAcceptThreshold(blockHeight: i64, hash: string): boolean {
    const prevoteArr = getPrevoteArray(blockHeight);
    return calculateVote(prevoteArr, hash, false)
}

export function isPrecommitAnyThreshold(blockHeight: i64, hash: string): boolean {
    const precommitArr = getPrecommitArray(blockHeight);
    const votes = new Array<ValidatorProposalVote>(precommitArr.length);
    for (let i = 0; i < precommitArr.length; i++) {
        votes[i] = precommitArr[i].vote;
    }
    return calculateVote(votes, hash, true)
}

export function isPrecommitAcceptThreshold(blockHeight: i64, hash: string): boolean {
    const precommitArr = getPrecommitArray(blockHeight);
    const votes = new Array<ValidatorProposalVote>(precommitArr.length);
    for (let i = 0; i < precommitArr.length; i++) {
        votes[i] = precommitArr[i].vote;
    }
    return calculateVote(votes, hash, false)
}

export function calculateVote(votePerNode: Array<ValidatorProposalVote>, hash: string, countNil: boolean): boolean {
    // hash is "" ony for threshold any votes
    // we recalculate token balance for each validator, each time we get the validator infos
    const validators = getAllValidators();

    // only active, bonded validators
    let totalStake = tnd.getTotalStakedActive(validators)
    const threshold = getBFTThreshold(totalStake);
    // calculate voting stake for the proposed block
    let count: BigInt = BigInt.zero();
    for (let i = 0; i < votePerNode.length; i++) {
        if (validators[i].jailed || validators[i].status != staking.BondedS) {
            continue;
        }
        if (votePerNode[i].hash == hash) {
            // @ts-ignore
            count += validators[i].tokens;
        } else if (countNil && votePerNode[i].hash == "nil") {
            // @ts-ignore
            count += validators[i].tokens;
        }
    }
    // @ts-ignore
    const committing = count >= threshold;
    LoggerDebug("calculate vote", ["threshold", threshold.toString(), "value", count.toString(), "passed", committing.toString(), "hash", hash])
    return committing;
}

function getBFTThreshold(totalState: BigInt): BigInt {
    return totalState.mul(BigInt.fromU32(2)).div(BigInt.fromU32(3)).add(BigInt.fromU32(1))
}

export function startBlockFinalizationFollower(index: i64): boolean {
    // get entry and apply it
    const entryobj = getLogEntryAggregate(index);
    if (entryobj == null) return false;
    return startBlockFinalizationFollowerInternal(entryobj)
}

export function startBlockFinalizationFollowerInternal(entryobj: LogEntryAggregate): boolean {
    LoggerInfo("start block finalization", ["height", entryobj.index.toString(), "termId", entryobj.termId.toString(), "proposerId", entryobj.leaderId.toString()])
    LoggerDebug("start block finalization", ["height", entryobj.index.toString(),  "data", JSON.stringify<wblocks.BlockEntry>(entryobj.data)])
    return startBlockFinalizationInternal(entryobj, false);
}

function startBlockFinalizationInternal(entryobj: LogEntryAggregate, retry: boolean): boolean {
    const processReqStr = String.UTF8.decode(decodeBase64(entryobj.data.data).buffer);
    const processReqWithMeta = JSON.parse<typestnd.RequestProcessProposalWithMetaInfo>(processReqStr);
    const processReq = processReqWithMeta.request

    // some blocks are stored out of order, so we run the block verification again
    const errorStr = tnd.verifyBlockProposal(entryobj.data, processReq)
    if (errorStr.length > 0) {
        LoggerError("new block rejected", ["height", processReq.height.toString(), "error", errorStr, "header", entryobj.data.header])
        return false;
    }

    const finalizeReq = new typestnd.RequestFinalizeBlock(
        processReq.txs,
        processReq.proposed_last_commit, // TODO we retrieve the signatures
        processReq.misbehavior,
        processReq.hash,
        processReq.height,
        processReq.time,
        processReq.next_validators_hash,
        processReq.proposer_address,
    )

    // advance round proposer queue if this is a receivedCommit and we did not participate in the round
    // we need to do this before finalizing the block because the validator composition might change
    const currentState = getCurrentState();
    const termId = getTermId();
    if (currentState.proposerQueueTermId < termId) {
        const validators = getAllValidators();
        // the difference should always be 1
        const rounds = termId - currentState.proposerQueueTermId;
        for (let i = 0; i < rounds; i++) {
            const resp = getNextProposer(validators, currentState.proposerQueue);
            currentState.proposerIndex = resp.proposerIndex;
            currentState.proposerQueueTermId = termId;
            currentState.proposerQueue = resp.proposerQueue;
        }
        setCurrentState(currentState)
    }

    // const blockDataBeginBlock = JSON.stringify<typestnd.RequestFinalizeBlock>(finalizeReq)
    // callHookContract("BeginBlock", blockDataBeginBlock);

    // if we have done optimisting execution, BeginBlock was already ran
    const oeran = processReqWithMeta.optimistic_execution && processReq.proposer_address == getSelfNodeInfo().address
    if (!oeran) {
        const resbegin = consensuswrap.BeginBlock(finalizeReq);
        if (resbegin.error.length > 0) {
            revert(`${resbegin.error}`);
        }
    }

    let respWrap = consensuswrap.FinalizeBlock(new typestnd.WrapRequestFinalizeBlock(finalizeReq, processReqWithMeta.metainfo));
    if (respWrap.error.length > 0 && !retry) {
        // ERR invalid height: 3232; expected: 3233
        const mismatchErr = `expected: ${(finalizeReq.height + 1).toString()}`
        LoggerError(`finalize block error`, ["error", respWrap.error])
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

    const commitBz = String.UTF8.decode(decodeBase64(entryobj.data.last_commit).buffer);
    const commit = JSON.parse<typestnd.BlockCommit>(commitBz);

    const last_commit_hash = getCommitHash(commit);
    const last_results_hash = getResultsHash(finalizeResp.tx_results);

    // update current state
    LoggerDebug("updating current state...", [])
    let state = getCurrentState();
    state.app_hash = finalizeResp.app_hash;
    // set temporary data that will be included in the next block
    state.last_block_id = getBlockID(finalizeReq.hash)
    state.last_commit_hash = last_commit_hash
    state.last_results_hash = last_results_hash
    state.nextHeight = finalizeReq.height + 1
    state.last_time = finalizeReq.time
    // for inclusion in BlockCommit in next block
    state.last_round = entryobj.termId;

    // TODO get precommits for block finalizeReq.height - 1 ??!
    // we move precommit votes for this block to current state, so it is included in the next block proposal
    state.last_block_signatures = getCommitSigsFromPrecommitArray(finalizeReq.height);
    setCurrentState(state);
    // update consensus params
    LoggerDebug("updating consensus parameters...", [])
    const consensusUpd = finalizeResp.consensus_param_updates
    updateConsensusParams(processReq.height, consensusUpd);

    // update validator info
    LoggerDebug("updating validator info...", [])
    updateValidators(finalizeResp.validator_updates);

    // ! make all state changes before the commit

    // save final block
    // and remove tx from mempool
    const mempool = getMempool()
    const txhashes: string[] = [];
    for (let i = 0; i < finalizeReq.txs.length; i++) {
        const hash = wasmxw.sha256(finalizeReq.txs[i]);
        txhashes.push(hash);
        mempool.remove(hash);
    }
    setMempool(mempool);

    const blockData = JSON.stringify<wblocks.BlockEntry>(entryobj.data)
    // also indexes transactions
    // index events: eventTopic => txhash[]
    const indexedTopics = extractIndexedTopics(finalizeResp, txhashes)
    setFinalizedBlock(blockData, finalizeReq.hash, txhashes, indexedTopics);

    // remove temporary block data
    removeLogEntry(entryobj.index);

    // before commiting, we check if consensus contract was changed
    // or if a new validator was added
    const info = consutil.defaultFinalizeResponseEventsParse(finalizeResp.tx_results)

    const respend = consensuswrap.EndBlock(blockData);
    if (respend.error.length > 0) {
        revert(`${respend.error}`);
    }

    // we need to store the latest AppHash after EndBlock! and before Commit
    // this is the true end of block finalization
    state = getCurrentState();
    state.app_hash = respend.data!.app_hash;
    setCurrentState(state)

    if (info.createdValidators.length > 0) {
        const createdValidators = new Array<consutil.CreatedValidator>(0);
        for (let i = 0; i < info.createdValidators.length; i++) {
            const v = info.createdValidators[i]
            const decodedTx = decodeTx(finalizeReq.txs[v.txindex])
            const operator = v.operator_address
            LoggerInfo("new validator", ["height", entryobj.index.toString(), "address", operator, "p2p_address", decodedTx.body.memo])
            const resp = parseNodeAddress(decodedTx.body.memo)
            if (resp.error.length == 0 && resp.node_info != null) {
                const nodeInfo = resp.node_info!;
                if (operator != nodeInfo.address) {
                    LoggerError("validator operator address mismatch, using operator_address", ["operator_address", operator, "memo", decodedTx.body.memo])
                    nodeInfo.address = operator
                }
                // add new node info to our validator info list
                updateNodeEntry(new NodeUpdate(nodeInfo, 0, cfg.NODE_UPDATE_ADD))
                // move node info to validator info if it exists
                callHookContract(hooks.HOOK_CREATE_VALIDATOR, JSON.stringify<NodeInfo>(nodeInfo));
                createdValidators.push(info.createdValidators[i])
            } else {
                LoggerError("validator node invalid address format", ["memo", decodedTx.body.memo])
            }
        }
        info.createdValidators = createdValidators;
    }

    if (info.initChainRequests.length > 0) {
        for (let i = 0; i < info.initChainRequests.length; i++) {
            const data = String.UTF8.decode(base64.decode(info.initChainRequests[i]).buffer)
            const req = JSON.parse<mctypes.InitSubChainDeterministicRequest>(data);
            initSubChain(req, state.validator_pubkey, state.validator_address, state.validator_privkey);
        }
    }

    // we have finalized and saved the new block
    // so we can execute setup on the new contract
    // this way, the delay of the timed action that starts the new consensus fsm is minimal.
    let newContractSetup = false;
    if (info.consensusContract !== "") {
        const myaddress = wasmxw.addr_humanize(wasmx.getAddress());
        LoggerInfo("setting up next consensus contract", ["new contract", info.consensusContract, "previous contract", myaddress])
        let calldata = `{"run":{"event":{"type":"setup","params":[{"key":"address","value":"${myaddress}"}]}}}`
        let req = new CallRequest(info.consensusContract, calldata, BigInt.zero(), 100000000, false);
        let resp = wasmxw.call(req, cfg.MODULE_NAME);
        if (resp.success > 0) {
            LoggerError("cannot setup next consensus contract", ["new contract", info.consensusContract, "err", resp.data]);
        } else {
            LoggerInfo("next consensus contract is set", ["new contract", info.consensusContract])
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
    LoggerInfo("block finalized", ["height", entryobj.index.toString(), "termId", entryobj.termId.toString(), "hash", base64ToHex(finalizeReq.hash).toUpperCase(), "proposer", finalizeReq.proposer_address])

    // make sure termId is synced
    setTermId(entryobj.termId)

    if (info.createdValidators.length > 0) {
        const ouraddr = getSelfNodeInfo().address
        for (let i = 0; i < info.createdValidators.length; i++) {
            if (info.createdValidators[i].operator_address == ouraddr) {
                LoggerInfo("node is validator", ["height", entryobj.index.toString(), "address", ouraddr])

                // call consensus contract with "becomeValidator" transition
                const calldatastr = `{"run":{"event": {"type": "becomeValidator", "params": []}}}`;
                callContract(wasmxw.getAddress(), calldatastr, false);
            }
        }
    }

    // TODO if we cannot start with the new contract, maybe we should remove its consensus role

    // if consensus changed, start the new contract
    if (info.consensusContract != "" && newContractSetup) {
        LoggerInfo("starting new consensus contract", ["address", info.consensusContract])
        let calldata = `{"run":{"event":{"type":"prestart","params":[]}}}`
        let req = new CallRequest(info.consensusContract, calldata, BigInt.zero(), 100000000, false);
        let resp = wasmxw.call(req, cfg.MODULE_NAME);
        if (resp.success > 0) {
            LoggerError("cannot start next consensus contract", ["new contract", info.consensusContract, "err", resp.data]);
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
            LoggerInfo("next consensus contract is started", ["new contract", info.consensusContract])
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
    if (nodeIps.length < (ourId + 1)) {
        revert(`index out of range: nodes count ${nodeIps.length}, our node id is ${ourId}`)
    }
    return nodeIps[ourId];
}

export function getCurrentProposer(): i32 {
    const state = getCurrentState();
    return state.proposerIndex;
}

export function isValidatorActive(validator: staking.Validator): bool {
    if (validator.jailed) return false;
    if (validator.status != staking.BondedS) return false;
    return true
}

export function isValidatorSimpleActive(validator: staking.ValidatorSimple): bool {
    if (validator.jailed) return false;
    if (validator.status != staking.BondedS) return false;
    return true
}

export function updateProposerQueue(validators: staking.Validator[], queue: ValidatorQueueEntry[]): ValidatorQueueEntry[] {
    const m = new Map<Bech32String,i32>();

    for (let i = 0; i < queue.length; i++) {
        m.set(queue[i].address, i)
    }
    for (let i = 0; i < validators.length; i++) {
        const v = validators[i];
        const active = isValidatorActive(v);
        // add current stake to this validator
        if (m.has(v.operator_address)) {
            const index = m.get(v.operator_address)
            if (active) {
                // @ts-ignore
                queue[index].value += v.tokens
            } else {
                queue[index].value = BigInt.zero()
            }
            // we now remove this validator from the map
            m.delete(v.operator_address)
        } else {
            // this is a new validator
            let value = v.tokens;
            if (!active) value = BigInt.zero();
            queue.push(new ValidatorQueueEntry(v.operator_address, i, value))
        }
    }

    // remaining validators in the map, were removed
    // sort DESC
    const indexes = m.values().sort((a: i32, b: i32) => b - a)
    for (let i = 0; i < indexes.length; i++) {
        queue.splice(indexes[i], 1);
    }

    return queue;
}

export function getNextProposer(validators: staking.Validator[], queue: ValidatorQueueEntry[]): GetProposerResponse {

    const newqueue = updateProposerQueue(validators, queue);

    // select max
    let maxValue = BigInt.zero();
    let proposerIndex: i32 = 0;
    let index: i32 = 0;
    for (let i = 0; i < newqueue.length; i++) {
        if (newqueue[i].value > maxValue) {
            proposerIndex = newqueue[i].index;
            index = i;
            maxValue = newqueue[i].value;
        }
    }

    // move proposer back in the queue
    newqueue[index].value = BigInt.zero();
    return new GetProposerResponse(newqueue, proposerIndex);
}

export function getLastBlockCommit(state: CurrentState): typestnd.BlockCommit {
    const bcommit = new typestnd.BlockCommit(state.nextHeight - 1, state.last_round, state.last_block_id, state.last_block_signatures)
    return bcommit
}

// the precommit array contains all existent validators, regardless of
// status or if they voted or not
export function getCommitSigsFromPrecommitArray(blockHeight: i64): typestnd.CommitSig[] {
    const precommitArr = getPrecommitArray(blockHeight);
    const sigs = new Array<typestnd.CommitSig>(precommitArr.length)
    for (let i = 0; i < precommitArr.length; i++) {
        const comm = precommitArr[i]
        const validator = getValidator(comm.vote.validatorAddress);
        const consKey = validator.consensus_pubkey
        if (consKey == null) {
            revert(`getCommitSigsFromPrecommitArray: validator missing consensus_pubkey: ${validator.operator_address}`)
            return sigs;
        }
        const addrhex = wasmxw.ed25519PubToHex(consKey.getKey().key)
        sigs[i] = new typestnd.CommitSig(comm.block_id_flag, addrhex, comm.vote.timestamp, comm.signature);
    }
    return sigs;
}

export function getValidator(addr: Bech32String): staking.Validator {
    const calldata = `{"GetValidator":{"validator_addr":"${addr}"}}`
    const resp = tnd.callStaking(calldata, true);
    if (resp.success > 0 || resp.data === "") {
        revert(`could not get validator: ${addr}`);
    }
    LoggerDebug("GetValidator", ["address", addr, "data", resp.data])
    const result = JSON.parse<staking.QueryValidatorResponse>(resp.data);
    return result.validator;
}

export function initSubChain(
    req: mctypes.InitSubChainDeterministicRequest,
    validatorPublicKey: Base64String,
    validatorHexAddr: HexString,
    validatorPrivateKey: Base64String,
): void {
    const chainId = req.init_chain_request.chain_id
    LoggerInfo("new subchain created", ["subchain_id", chainId])

    // we initialize only if we are a validator here
    const appstate = base64ToString(req.init_chain_request.app_state_bytes)
    const genesisState: mctypes.GenesisState = JSON.parse<mctypes.GenesisState>(appstate)
    const weAreValidator = isNodeValidator(genesisState, validatorPublicKey)

    if (!weAreValidator.isvalidator) {
        LoggerInfo("node is not validating the new subchain; not initializing", ["subchain_id", chainId])
        return;
    }
    LoggerInfo("node is validating the new subchain", ["subchain_id", chainId])

    // initialize the chain
    const msg = new mctypes.InitSubChainMsg(
        req.init_chain_request,
        req.chain_config,
        validatorHexAddr,
        validatorPrivateKey,
        validatorPublicKey,
        req.peers,
        weAreValidator.nodeIndex,
        // multichain local registry will fill in the ports
        new mctypes.NodePorts(),
    )

    // pass the data to the metaregistry contract on this chain
    // the metaregistry contract will forward the data to level0 metaregistry
    // level0 metaregistry will call the local registry, which will assign ports so the subchain is started
    callHookNonCContract(hooks.HOOK_NEW_SUBCHAIN, JSON.stringify<mctypes.InitSubChainMsg>(msg));
}

export function isNodeValidator(genesisState: mctypes.GenesisState, ourPublicKey: string): IsNodeValidator {
    if (!genesisState.has(modnames.MODULE_GENUTIL)) {
        revert(`genesis state missing field: ${modnames.MODULE_GENUTIL}`)
    }
    const genutilGenesisStr = base64ToString(genesisState.get(modnames.MODULE_GENUTIL))
    const genutilGenesis = JSON.parse<mctypes.GenutilGenesis>(genutilGenesisStr)
    let weAreValidator = false;
    let currentNodeId = 0;
    for (let i = 0; i < genutilGenesis.gen_txs.length; i++) {
        const gentx = String.UTF8.decode(base64.decode(genutilGenesis.gen_txs[i]).buffer)
        const tx = JSON.parse<SignedTransaction>(gentx);
        const msg = stakingutils.extractCreateValidatorMsg(tx)
        if (msg == null) continue;
        const consKey = msg.pubkey
        if (consKey == null) continue;
        if (consKey.getKey().key == ourPublicKey) {
            weAreValidator = true;
            // NOTE: requires req.peers order is the same as gentx
            currentNodeId = i;
            break;
        }
    }
    if (genutilGenesis.gen_txs.length > 0) {
        return new IsNodeValidator(weAreValidator, currentNodeId)
    }

    // look into staking data
    if (!genesisState.has(modnames.MODULE_COSMOSMOD)) {
        revert(`genesis state missing field: ${modnames.MODULE_COSMOSMOD}`)
    }
    const cosmosmodGenesisStr = base64ToString(genesisState.get(modnames.MODULE_COSMOSMOD))
    const cosmosmodGenesis = JSON.parse<CosmosmodGenesisState>(cosmosmodGenesisStr)
    for (let i = 0; i < cosmosmodGenesis.staking.validators.length; i++) {
        const v = cosmosmodGenesis.staking.validators[i]
        const consKey = v.consensus_pubkey
        if (consKey == null) continue;
        if (consKey.getKey().key == ourPublicKey) {
            weAreValidator = true;
            // NOTE: requires req.peers order is the same as gentx
            currentNodeId = i;
            break;
        }
    }
    return new IsNodeValidator(weAreValidator, currentNodeId)
}

export function getProtocolId(state: CurrentState): string {
    return getProtocolIdInternal(state.chain_id)
}

export function getTopic(state: CurrentState, topic: string): string {
    const base = state.chain_id + "_" + state.unique_p2p_id
    return getTopicInternal(base, topic)
}

export function getProtocolIdInternal(chainId: string): string {
    return cfg.PROTOCOL_ID + "_" + chainId
}

export function getTopicInternal(chainId: string, topic: string): string {
    return topic + "_" + chainId
}

export function getAllValidatorInfos(): staking.ValidatorSimple[] {
    const calldata = `{"GetAllValidatorInfos":{}}`
    const resp = tnd.callStaking(calldata, true);
    if (resp.success > 0) {
        revert("could not get validators");
    }
    if (resp.data === "") return [];
    LoggerDebug("GetAllValidatorInfos", ["data", resp.data])
    const result = JSON.parse<staking.QueryValidatorInfosResponse>(resp.data);
    return result.validators;
}

export function weAreNotAlone(): boolean {
    return weAreNotAloneInternal(getValidatorNodesInfo())
}

export function weAreNotAloneInternal(nodes: Array<NodeInfo>): boolean {
    if (nodes.length > 1) return true;
    return false
}

export function nodeInfoComplete(): boolean {
    return nodeInfoCompleteInternal(getValidatorNodesInfo())
}

export function nodeInfoCompleteInternal(nodes: Array<NodeInfo>): boolean {
    return nodes.length == getAllValidatorInfos().length
}

export function parseNodeAddress(peeraddr: string): NodeInfoResponse {
    return raftp2pactions.parseNodeAddress(peeraddr)
}

export function updateNodeEntry(entry: NodeUpdate): void {
    let ips = getValidatorNodesInfo();

    // new node or node comming back online
    if (entry.type == cfg.NODE_UPDATE_ADD) {
        if (entry.node.node.ip == "" && entry.node.node.host == "") {
            revert(`validator info missing from node update: address ${entry.node.address}`)
        }
        // make it idempotent & don't add same node address multiple times
        let ndx = -1
        for (let i = 0; i < ips.length; i++) {
            if (ips[i].address == entry.node.address) {
                ndx = i;
                break;
            }
        }
        if (ndx > -1) {
            // we just update the node
            ips[ndx].node = entry.node.node
        } else {
            // TODO mark as outofsync for raft too?
            ips.push(entry.node);
            // TODO adding a new node must be under the same index as in the validators array
        }
    }
    else if (entry.type == cfg.NODE_UPDATE_UPDATE) {
        // just update the node
        ips[entry.index].node = entry.node.node;
    }
    else if (entry.type == cfg.NODE_UPDATE_REMOVE) {
        // idempotent
        ips = removeNode(ips, entry.index)
    }

    LoggerInfo("node updates", ["ips", JSON.stringify<NodeInfo[]>(ips)])
    setValidatorNodesInfo(ips);
}
