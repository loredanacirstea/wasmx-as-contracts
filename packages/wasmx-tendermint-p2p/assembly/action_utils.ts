import { JSON } from "json-as/assembly";
import { decode as decodeBase64, encode as encodeBase64 } from "as-base64/assembly";
import * as base64 from "as-base64/assembly"
import { ActionParam, EventObject, ExternalActionCallData } from "xstate-fsm-as/assembly/types";
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as wblocks from "wasmx-blocks/assembly/types";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as consutil from "wasmx-consensus/assembly/utils";
import * as staking from "wasmx-stake/assembly/types";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as roles from "wasmx-env/assembly/roles";
import * as modnames from "wasmx-env/assembly/modules";
import * as mctypes from "wasmx-consensus/assembly/types_multichain";
import * as mcwrap from 'wasmx-consensus/assembly/multichain_wrap';
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as tnd from "wasmx-tendermint/assembly/actions";
import { buildLogEntryAggregate, callContract, callHookContract, getMempool, getTotalStaked, setMempool, updateConsensusParams, updateValidators } from "wasmx-tendermint/assembly/actions";
import * as cfg from "./config";
import { AppendEntry, LogEntryAggregate } from "./types";
import { LoggerDebug, LoggerError, LoggerInfo, revert } from "./utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { appendLogEntry, getCurrentNodeId, getCurrentState, getLastLogIndex, getLogEntryObj, getPrecommitArray, getPrevoteArray, getTermId, getValidatorNodeCount, getValidatorNodesInfo, removeLogEntry, setCurrentState, setLogEntryAggregate, setPrecommitArray, setPrevoteArray } from "./storage";
import { getAllValidators, signMessage } from "wasmx-raft/assembly/action_utils";
import { CurrentState, GetProposerResponse, SignedMsgType, ValidatorCommitVote, ValidatorProposalVote, ValidatorQueueEntry } from "./types_blockchain";
import { Base64String, Bech32String, CallRequest, CallResponse, SignedTransaction } from "wasmx-env/assembly/types";
import { LOG_START } from "./config";
import { NodeInfo } from "wasmx-raft/assembly/types_raft";
import { base64ToHex, base64ToString, parseUint8ArrayToU32BigEndian, uint8ArrayToHex } from "wasmx-utils/assembly/utils";
import { extractIndexedTopics, getCommitHash, getConsensusParamsHash, getEvidenceHash, getHeaderHash, getResultsHash, getTxsHash, getValidatorsHash } from "wasmx-consensus-utils/assembly/utils";
import * as stakingutils from "wasmx-stake/assembly/msg_utils";

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
        req.validator_address,
        req.validator_privkey,
        req.validator_pubkey,
        LOG_START + 1, "", 0, 0, 0, 0,
        [], 0, 0,
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
    const senderaddr = getSelfNodeInfo().address
    const msgstr = `{"run":{"event":{"type":"receiveBlockProposal","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"},{"key": "sender","value":"${senderaddr}"}]}}}`
    return msgstr
}

export function isPrevoteAnyThreshold(blockHeight: i64): boolean {
    const prevoteArr = getPrevoteArray(blockHeight);
    return calculateVote(prevoteArr, "")
}

export function isPrevoteAcceptThreshold(blockHeight: i64, hash: string): boolean {
    const prevoteArr = getPrevoteArray(blockHeight);
    return calculateVote(prevoteArr, hash)
}

export function isPrecommitAnyThreshold(blockHeight: i64): boolean {
    const precommitArr = getPrecommitArray(blockHeight);
    const votes = new Array<ValidatorProposalVote>(precommitArr.length);
    for (let i = 0; i < precommitArr.length; i++) {
        votes[i] = precommitArr[i].vote;
    }
    return calculateVote(votes, "")
}

export function isPrecommitAcceptThreshold(blockHeight: i64, hash: string): boolean {
    const precommitArr = getPrecommitArray(blockHeight);
    const votes = new Array<ValidatorProposalVote>(precommitArr.length);
    for (let i = 0; i < precommitArr.length; i++) {
        votes[i] = precommitArr[i].vote;
    }
    return calculateVote(votes, hash)
}

export function calculateVote(votePerNode: Array<ValidatorProposalVote>, hash: string): boolean {
    // hash is "" ony for threshold any votes
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
        if (hash == "") { // any vote
            if (votePerNode[i].hash != "") { // it can be a valid hash or "nil"
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
    LoggerDebug("calculate vote", ["threshold", threshold.toString(), "value", count.toString(), "passed", committing.toString(), "hash", hash])
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
        processReq.proposed_last_commit, // TODO we retrieve the signatures
        processReq.misbehavior,
        processReq.hash,
        processReq.height,
        processReq.time,
        processReq.next_validators_hash,
        processReq.proposer_address,
    )

    // const blockDataBeginBlock = JSON.stringify<typestnd.RequestFinalizeBlock>(finalizeReq)
    // callHookContract("BeginBlock", blockDataBeginBlock);
    const resbegin = consensuswrap.BeginBlock(finalizeReq);
    if (resbegin.error.length > 0) {
        revert(`${resbegin.error}`);
    }

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

    const commitBz = String.UTF8.decode(decodeBase64(entryobj.data.last_commit).buffer);
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
    // TODO get precommits for block finalizeReq.height - 1 ??!
    // we move precommit votes for this block to current state, so it is included in the next block proposal
    state.last_block_signatures = getCommitSigsFromPrecommitArray(finalizeReq.height);
    setCurrentState(state);
    // update consensus params
    LoggerDebug("updating consensus parameters...", [])
    const consensusUpd = finalizeResp.consensus_param_updates
    if (consensusUpd != null) {
        updateConsensusParams(consensusUpd);
    }
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
    let evs = finalizeResp.events
    for (let i = 0; i < finalizeResp.tx_results.length; i++) {
        evs = evs.concat(finalizeResp.tx_results[i].events)
    }
    const info = consutil.defaultFinalizeResponseEventsParse(evs)

    const resend = consensuswrap.EndBlock(blockData);
    if (resend.error.length > 0) {
        revert(`${resend.error}`);
    }

    if (info.createdValidators.length > 0) {
        for (let i = 0; i < info.createdValidators.length; i++) {
            // move node info to validator info if it exists
            LoggerInfo("new validator", ["height", entryobj.index.toString(), "address", info.createdValidators[i]])
            callHookContract("CreatedValidator", info.createdValidators[i]);
        }
    }

    if (info.initChainRequests.length > 0) {
        for (let i = 0; i < info.initChainRequests.length; i++) {
            initSubChain(info.initChainRequests[i], state);
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
    LoggerInfo("block finalized", ["height", entryobj.index.toString(), "termId", entryobj.termId.toString()])

    if (info.createdValidators.length > 0) {
        const ouraddr = getSelfNodeInfo().address
        for (let i = 0; i < info.createdValidators.length; i++) {
            if (info.createdValidators[i] == ouraddr) {
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

export function getLastBlockCommit(height: i64, state: CurrentState): typestnd.BlockCommit {
    const bcommit = new typestnd.BlockCommit(height, state.last_round, state.last_block_id, state.last_block_signatures)
    return bcommit
}

export function getCommitSigsFromPrecommitArray(blockHeight: i64): typestnd.CommitSig[] {
    const precommitArr = getPrecommitArray(blockHeight);
    const sigs = new Array<typestnd.CommitSig>(precommitArr.length)
    for (let i = 0; i < precommitArr.length; i++) {
        const comm = precommitArr[i]
        // TODO vote.validatorAddress make it hex; now is bech32
        // we need the consensus key
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

export function initSubChain(encodedData: Base64String, state: CurrentState): typestnd.ResponseInitChain | null {
    const data = String.UTF8.decode(base64.decode(encodedData).buffer)
    const req = JSON.parse<mctypes.InitSubChainDeterministicRequest>(data);
    const chainId = req.init_chain_request.chain_id
    LoggerInfo("new subchain created", ["subchain_id", chainId])

    // we initialize only if we are a validator here
    const appstate = base64ToString(req.init_chain_request.app_state_bytes)
    const genesisState: mctypes.GenesisState = JSON.parse<mctypes.GenesisState>(appstate)

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
        if (consKey.getKey().key == state.validator_pubkey) {
            weAreValidator = true;
            // NOTE: requires req.peers order is the same as gentx
            currentNodeId = i;
            break;
        }
    }

    if (!weAreValidator) {
        return null;
    }
    LoggerInfo("node is validating the new subchain", ["subchain_id", chainId])

    // add the chainId to our internal node registry
    const calldatastr = `{"AddSubChainId":{"id":"${chainId}"}}`
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY_LOCAL, calldatastr, false)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`call to ${roles.ROLE_MULTICHAIN_REGISTRY_LOCAL} failed`, ["error", resp.data, "subchain_id", chainId.toString()])
    }

    // initialize the chain
    const msg = new mctypes.InitSubChainMsg(
        req.init_chain_request,
        req.chain_config,
        state.validator_address,
        state.validator_privkey,
        state.validator_pubkey,
        req.peers,
        currentNodeId,
    )
    LoggerInfo("initializing subchain", ["subchain_id", chainId])
    const response = mcwrap.InitSubChain(msg);
    LoggerInfo("initialized subchain", ["subchain_id", chainId])
    return response;
}

export function getProtocolId(state: CurrentState): string {
    return cfg.PROTOCOL_ID + "_" + state.chain_id
}

export function getTopic(state: CurrentState, topic: string): string {
    return topic + "_" + state.chain_id
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
