import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64, encode } from "as-base64/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as staking from "wasmx-stake/assembly/types";
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import {
    Base64String,
    Bech32String,
    CallRequest,
    CallResponse,
    HexString,
  } from 'wasmx-env/assembly/types';
  import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import { parseInt32, parseUint8ArrayToU32BigEndian, base64ToHex, stringToBase64 } from "wasmx-utils/assembly/utils";
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import { LoggerDebug, LoggerInfo, LoggerError, revert } from "./utils";
import {
    getBlocks,
    getConfidence,
    getNodeIPs,
    setBlocks,
    setConfidence,
} from './storage';
import { CurrentState, Mempool } from "./types_blockchain";
import { LogEntry, LogEntryAggregate, AppendEntry, NodeUpdate, UpdateNodeResponse, AppendEntryResponse, TransactionResponse, Precommit, QueryResponse, TempBlock, MODULE_NAME, NodeInfo } from "./types";
import {
    CURRENT_NODE_ID,
    NODE_IPS,
    BlockProtocol,
    PROPOSED_HASH_KEY,
    BETA_THRESHOLD_KEY,
    MaxBlockSizeBytes,
    MAJORITY_KEY,
    PROPOSED_HEADER_KEY,
    PROPOSED_BLOCK_KEY,
    ALPHA_THRESHOLD_KEY,
    SAMPLE_SIZE_KEY,
    MAJORITY_COUNT_KEY,
} from './config';
import {
    setNodeIPs,
    setCurrentState,
    getMempool,
    setMempool,
    setCurrentNodeId,
    setLastLogIndex,
    getLastLogIndex,
    getCurrentState,
    appendLogEntry,
    getLogEntryObj,
    removeLogEntry,
    getCurrentNodeId,
    getRoundsCounter,
    setRoundsCounter,
    resetBlocks,
    resetConfidences as _resetConfidences,
} from './storage';
import { BigInt } from "wasmx-env/assembly/bn";
import { extractIndexedTopics, getCommitHash, getConsensusParamsHash, getEvidenceHash, getHeaderHash, getResultsHash, getTxsHash, getValidatorsHash } from "wasmx-consensus-utils/assembly/utils"

/// guards

export function ifMajorityConfidenceGTCurrent(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("majority")) {
        revert("no majority found");
    }
    const majority = parseInt32(ctx.get("majority"));
    const currentHash = fsm.getContextValue(PROPOSED_HASH_KEY);
    const confidence = getConfidence(currentHash);
    LoggerInfo("ifMajorityConfidenceGTCurrent", ["majority", majority.toString(), "confidence", confidence.toString(), "currentHash", currentHash])
    if (majority > confidence) return true;
    return false;
}

export function ifIncrementedCounterLTBetaThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const counter = getRoundsCounter();
    const betaThreshold = parseInt32(fsm.getContextValue(BETA_THRESHOLD_KEY) || "");
    LoggerInfo("ifIncrementedCounterLTBetaThreshold", ["incremented_counter", (counter + 1).toString(), "beta_threshold", betaThreshold.toString()])
    if ((counter + 1) < betaThreshold) return true;
    return false;
}

export function ifMajorityIsOther(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const proposedHash = fsm.getContextValue(PROPOSED_HASH_KEY);
    const majority = fsm.getContextValue(MAJORITY_KEY);
    LoggerInfo("ifMajorityIsOther", ["majority", majority.toString(), "proposedHash", proposedHash])
    return majority != proposedHash;
}

export function ifBlockNotFinalized(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("block")) {
        revert("no block found");
    }
    let blockBase64: Base64String = ctx.get("block");
    console.debug("ifBlockNotFinalized: " + blockBase64);
    const block = JSON.parse<wblocks.BlockEntry>(String.UTF8.decode(decodeBase64(blockBase64).buffer))
    // make sure we don't add an already finalized block
    const lastIndex = getLastBlockIndex();
    LoggerInfo("ifBlockNotFinalized", ["block_height", block.index.toString(), "last_finalized_height", lastIndex.toString()])
    return lastIndex < block.index;
}

export function ifMajorityLTAlphaThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const percentage = parseInt32(fsm.getContextValue(ALPHA_THRESHOLD_KEY));
    const k = parseInt32(fsm.getContextValue(SAMPLE_SIZE_KEY));
    const threshold = i32(Math.ceil(f32(k * percentage) / f32(100)))
    const majority = parseInt32(fsm.getContextValue(MAJORITY_COUNT_KEY));
    LoggerInfo("ifMajorityLTAlphaThreshold", ["sampleSize", k.toString(), "threshold", threshold.toString(), "majority", majority.toString()]);
    return majority < threshold;
}

/// actions

export function incrementRoundsCounter(
    params: ActionParam[],
    event: EventObject,
): void {
    const counter = getRoundsCounter();
    setRoundsCounter(counter + 1);
}

export function resetRoundsCounter(
    params: ActionParam[],
    event: EventObject,
): void {
    setRoundsCounter(0);
}

export function resetConfidences(
    params: ActionParam[],
    event: EventObject,
): void {
    _resetConfidences();
    // also remove temporary block data
    resetBlocks();
}

export function sendResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("block")) {
        revert("no block found");
    }
    if (!ctx.has("header")) {
        revert("no header found");
    }
    let blockBase64: Base64String = ctx.get("block");
    let headerBase64: Base64String = ctx.get("header");

    const block = JSON.parse<wblocks.BlockEntry>(String.UTF8.decode(decodeBase64(blockBase64).buffer))
    // if it is an already finalized block, we send that block
    const lastIndex = getLastBlockIndex();
    if (lastIndex >= block.index) {
        // send the finalized block
        const data = getFinalBlock(block.index);
        const blockData = JSON.parse<wblocks.BlockEntry>(data);
        blockBase64 = blockData.data;
        headerBase64 = blockData.header;
        LoggerInfo("send query response: block already finalized", ["height", blockData.index.toString()])
    }

    // temp
    // const data = JSON.parse<typestnd.RequestFinalizeBlock>(block.data)
    // LoggerInfo("send query response", ["height", block.index.toString(), "hash", data.hash])
    LoggerInfo("send query response", ["height", block.index.toString()])

    const response = JSON.stringify<QueryResponse>(new QueryResponse(blockBase64, headerBase64));
    LoggerDebug("send query response", ["response", response])
    wasmx.setFinishData(String.UTF8.encode(response));
    return;
}

export function proposeBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("transaction")) {
        revert("no transaction found");
    }
    const transaction: Base64String = ctx.get("transaction");
    const mempool = getMempool();
    mempool.add(transaction, 3000000);
    const cparams = getConsensusParams();
    let maxbytes = cparams.block.max_bytes;
    if (maxbytes == -1) {
        maxbytes = MaxBlockSizeBytes;
    }
    const batch = mempool.batch(cparams.block.max_gas, maxbytes);
    // start proposal protocol
    // TODO correct gas
    startBlockProposal(batch.txs, 10000000, maxbytes);
}

export function setProposedBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("header")) {
        revert("no header found");
    }
    if (!ctx.has("block")) {
        revert("no block found");
    }
    const headerStr: Base64String = ctx.get("header");
    const blockStr: Base64String = ctx.get("block");
    // TODO block validation
    const header = JSON.parse<typestnd.Header>(String.UTF8.decode(decodeBase64(headerStr).buffer))
    const hash = getHeaderHash(header)
    fsm.setContextValue(PROPOSED_HASH_KEY, hash)
    fsm.setContextValue(PROPOSED_HEADER_KEY, headerStr)
    fsm.setContextValue(PROPOSED_BLOCK_KEY, blockStr)
}

export function majorityFromRandomSet(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("k")) {
        revert("no k found");
    }
    // sampleSize
    const k = parseInt32(ctx.get("k"));

    // get proposed block
    const proposedHash = fsm.getContextValue(PROPOSED_HASH_KEY);
    const proposedHeader = fsm.getContextValue(PROPOSED_HEADER_KEY);
    const proposedBlock = fsm.getContextValue(PROPOSED_BLOCK_KEY);

    LoggerDebug("send query to random set", ["k", k.toString(), "proposedHash", proposedHash, "proposedHeader", proposedHeader])
    console.debug("* block: " + proposedBlock);

    // select from validators
    const nodeIps = getNodeIPs();
    const currentNode = getCurrentNodeId();
    const sampleIndexes = getRandomSample(k, proposedHash, nodeIps.length, currentNode);
    LoggerDebug("send query to random set", ["sample ips", sampleIndexes.join(",")])
    // we send the request to the same contract
    const contract = wasmx.getAddress();
    const request = new QueryResponse(proposedBlock, proposedHeader);
    const responseCounter = new Map<string,i32>();
    const responses = new Map<string,QueryResponse>();
    responseCounter.set(proposedHash, 1);
    responses.set(proposedHash, request);

    const roundCounter = getRoundsCounter();
    LoggerInfo("sending query to random set", ["sample_size", k.toString(), "proposed_hash", proposedHash, "round_counter", roundCounter.toString()])

    for (let i = 0; i < sampleIndexes.length; i++) {
        const nodeIp = nodeIps[sampleIndexes[i]];
        const resp = sendQuery(nodeIp.ip, contract, request);
        if (resp != null) {
            if (resp.block != proposedBlock) {
                const header = JSON.parse<typestnd.Header>(String.UTF8.decode(decodeBase64(resp.header).buffer))
                const hash = getHeaderHash(header)
                if (!responseCounter.has(hash)) {
                    responseCounter.set(hash, 1);
                } else {
                    responseCounter.set(hash, responseCounter.get(hash) + 1);
                }
                responses.set(hash, resp);
                LoggerInfo("query response", ["from", nodeIp.ip, "proposed_hash", hash])
            } else {
                responseCounter.set(proposedHash, responseCounter.get(proposedHash) + 1);
                LoggerInfo("query response", ["from", nodeIp.ip, "proposed_hash", proposedHash])
            }
        }
    }
    // calculate majority
    const allhashes = responseCounter.keys();
    LoggerInfo("block options", ["hashes", allhashes.join(",")])
    let majorityCount = 0;
    let majorityHash = allhashes[0];
    let majorityBlock_: QueryResponse | null = null;
    for (let i = 0; i < allhashes.length; i++) {
        const count = responseCounter.get(allhashes[i]);
        if (majorityCount < count) {
            majorityCount = count;
            majorityHash = allhashes[i]
            majorityBlock_ = responses.get(majorityHash);
        }
    }
    LoggerInfo("majority block", ["hash", majorityHash, "count", majorityCount.toString()])
    if (majorityBlock_ == null) {
        return;
    }
    const majorityBlock: QueryResponse = majorityBlock_;
    fsm.setContextValue(MAJORITY_KEY, majorityHash);
    fsm.setContextValue(MAJORITY_COUNT_KEY, majorityCount.toString());
    setBlocks(majorityBlock!.block, majorityBlock!.header, majorityHash);
}

// TODO only remove mempool transactions after the block was finalized
export function changeProposedBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("hash")) {
        revert("no hash found");
    }
    const hash = ctx.get("hash")
    // get block & header for this hash
    const tempblocks = getBlocks()
    let tempblock: TempBlock | null = null;
    for (let i = 0; i < tempblocks.length; i++) {
        if(tempblocks[i].hash == hash) {
            tempblock = tempblocks[i];
            break;
        }
    }
    if (!tempblock) {
        revert("block not found for majority hash ")
    }
    const block: TempBlock = tempblock!;

    LoggerInfo("changing block option", ["hash", hash])

    fsm.setContextValue(PROPOSED_HASH_KEY, hash);
    fsm.setContextValue(PROPOSED_HEADER_KEY, block.header);
    fsm.setContextValue(PROPOSED_BLOCK_KEY, block.block);
}

export function incrementConfidence(
    params: ActionParam[],
    event: EventObject,
): void {
    // hash
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("hash")) {
        revert("no hash found");
    }
    const hash = ctx.get("hash");
    const value = getConfidence(hash);
    setConfidence(hash, value+1);
}

export function finalizeBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    const blockEntryBase64 = fsm.getContextValue(PROPOSED_BLOCK_KEY);
    console.debug("* finalizeBlock blockEntryBase64: " + blockEntryBase64);
    const blockEntry = String.UTF8.decode(decodeBase64(blockEntryBase64).buffer);
    console.debug("* finalizeBlock blockEntry: " + blockEntry);
    const block = JSON.parse<wblocks.BlockEntry>(blockEntry)
    const entryobj = new LogEntryAggregate(block.index, 0, 0, block)
    LoggerInfo("start block finalization", ["height", block.index.toString()])
    startBlockFinalizationInternal(entryobj, false);
}

/// setup

export function setup(
    params: ActionParam[],
    event: EventObject,
): void {
    LoggerInfo("setting up new raft consensus contract", [])
    // get nodeIPs and validators from old contract
    // get currentState
    // get mempool
    let oldContract = "";
    if (params.length > 0) {
        oldContract = params[0].value;
    } else if (event.params.length > 0) {
        oldContract = event.params[0].value;
    }
    if (oldContract == "") {
        return revert("previous contract address not provided")
    }

    let calldata = `{"getContextValue":{"key":"${NODE_IPS}"}}`
    let req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    let resp = wasmxw.call(req, MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get nodeIPs from previous contract")
    }
    let data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up nodeIPs", ["ips", data])
    const nodeIps = JSON.parse<Array<NodeInfo>>(data)
    setNodeIPs(nodeIps);

    calldata = `{"getContextValue":{"key":"state"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    resp = wasmxw.call(req);
    if (resp.success > 0) {
        return revert("cannot get state from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up state", ["data", data])
    const state = JSON.parse<CurrentState>(data)
    setCurrentState(state);

    calldata = `{"getContextValue":{"key":"mempool"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    resp = wasmxw.call(req);
    if (resp.success > 0) {
        return revert("cannot get mempool from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up mempool", ["data", data])
    const mempool = JSON.parse<Mempool>(data)
    setMempool(mempool);

    calldata = `{"getContextValue":{"key":"currentNodeId"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    resp = wasmxw.call(req);
    if (resp.success > 0) {
        return revert("cannot get currentNodeId from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up currentNodeId", ["data", data])
    const currentNodeId = parseInt32(data);
    setCurrentNodeId(currentNodeId);

    // get last block index from storage contract
    const lastIndex = getLastBlockIndex();
    LoggerInfo("setting up last log index", ["index", lastIndex.toString()])
    setLastLogIndex(lastIndex);
}

export function setupNode(
    params: ActionParam[],
    event: EventObject,
): void {
    let currentNodeId: string = "";
    let initChainSetup: string = "";
    for (let i = 0; i < event.params.length; i++) {
        if (event.params[i].key === CURRENT_NODE_ID) {
            currentNodeId = event.params[i].value;
            continue;
        }
        if (event.params[i].key === "initChainSetup") {
            initChainSetup = event.params[i].value;
            continue;
        }
    }
    if (currentNodeId === "") {
        revert("no currentNodeId found");
    }
    if (initChainSetup === "") {
        revert("no initChainSetup found");
    }
    fsm.setContextValue(CURRENT_NODE_ID, currentNodeId);

    // TODO ID@host:ip
    // 6efc12ab37fc0e096d8618872f6930df53972879@0.0.0.0:26757

    const datajson = String.UTF8.decode(decodeBase64(initChainSetup).buffer);
    // TODO remove validator private key from logs in initChainSetup
    LoggerDebug("setupNode", ["currentNodeId", currentNodeId, "initChainSetup", datajson])
    const data = JSON.parse<typestnd.InitChainSetup>(datajson);

    const peers = new Array<NodeInfo>(data.peers.length);
    for (let i = 0; i < data.peers.length; i++) {
        const peer = data.peers[i].split("@");
        if (peer.length != 2) {
            revert(`invalid node format; found: ${data.peers[i]}`)
        }
        peers[i] = new NodeInfo(peer[0], peer[1]);
    }
    setNodeIPs(peers);

    initChain(data);
}

function initChain(req: typestnd.InitChainSetup): void {
    LoggerDebug("start chain init", [])

    // TODO what are the correct empty valuew?
    const emptyBlockId = new typestnd.BlockID("", new typestnd.PartSetHeader(0, ""))
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
    );

    const valuestr = JSON.stringify<CurrentState>(currentState);
    LoggerDebug("set current state", ["state", valuestr])
    setCurrentState(currentState);
    setConsensusParams(req.consensus_params);
}

/// implementations

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

function startBlockProposal(txs: string[], cummulatedGas: i64, maxDataBytes: i64): void {
    // PrepareProposal TODO finish
    const height = getLastBlockIndex() + 1;
    LoggerDebug("start block proposal", ["height", height.toString()])

    const currentState = getCurrentState();
    const validators = getAllValidators();

    // TODO correct votes?
    // lastExtCommit *types.ExtendedCommit
    // lastExtCommit = cs.LastCommit.MakeExtendedCommit(cs.state.ConsensusParams.ABCI)
    const localLastCommit = new typestnd.ExtendedCommitInfo(0, new Array<typestnd.ExtendedVoteInfo>(0));
    const nextValidatorsHash = getValidatorsHash(validators);
    const misbehavior: typestnd.Misbehavior[] = []; // block.Evidence.Evidence.ToABCI()
    const time = new Date(Date.now())
    const prepareReq = new typestnd.RequestPrepareProposal(
        maxDataBytes,
        txs,
        localLastCommit,
        misbehavior,
        height,
        time.toISOString(),
        nextValidatorsHash,
        currentState.validator_address,
    );

    const prepareResp = consensuswrap.PrepareProposal(prepareReq);

    // ProcessProposal: now check block is valid
    const lastCommit = new typestnd.CommitInfo(0, []); // TODO
    const lastBlockCommit = new typestnd.BlockCommit(prepareReq.height -1, 0, currentState.last_block_id, []); // TODO
    const evidence = new typestnd.Evidence(); // TODO
    // TODO load app version from storage or Info()?

    const header = new typestnd.Header(
        new typestnd.VersionConsensus(BlockProtocol, currentState.version.consensus.app),
        currentState.chain_id,
        prepareReq.height,
        prepareReq.time,
        currentState.last_block_id,
        base64ToHex(getCommitHash(lastBlockCommit)),
        base64ToHex(getTxsHash(prepareResp.txs)),
        base64ToHex(nextValidatorsHash),
        base64ToHex(nextValidatorsHash),
        base64ToHex(getConsensusParamsHash(getConsensusParams())),
        base64ToHex(currentState.app_hash),
        base64ToHex(currentState.last_results_hash),
        base64ToHex(getEvidenceHash(evidence)),
        prepareReq.proposer_address,
    );
    const hash = getHeaderHash(header);
    LoggerInfo("start block proposal", ["height", height.toString(), "hash", hash])
    const processReq = new typestnd.RequestProcessProposal(
        prepareResp.txs,
        lastCommit,
        prepareReq.misbehavior,
        hash,
        prepareReq.height,
        prepareReq.time,
        prepareReq.next_validators_hash,
        prepareReq.proposer_address,
    )
    const processResp = consensuswrap.ProcessProposal(processReq);
    if (processResp.status === typestnd.ProposalStatus.REJECT) {
        // TODO - what to do here? returning just discards the block and the transactions
        LoggerError("new block rejected", ["height", processReq.height.toString(), "node type", "Leader"])
        return;
    }
    // We have a valid proposal to propagate to other nodes
    appendLogInternalVerified2(processReq, header, lastBlockCommit);
}

function appendLogInternalVerified2(processReq: typestnd.RequestProcessProposal, header: typestnd.Header, blockCommit: typestnd.BlockCommit): void {
    const blockData = JSON.stringify<typestnd.RequestProcessProposal>(processReq);
    const blockDataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(blockData)))
    const blockHeader = JSON.stringify<typestnd.Header>(header);
    const blockHeaderBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(blockHeader)))
    const commit = JSON.stringify<typestnd.BlockCommit>(blockCommit);
    const commitBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(commit)))
    const contractAddress = encodeBase64(Uint8Array.wrap(wasmx.getAddress()));
    const validator = getValidatorByHexAddr(processReq.proposer_address);
    const blockEntry = new wblocks.BlockEntry(
        processReq.height,
        contractAddress,
        contractAddress,
        blockDataBase64,
        blockHeaderBase64,
        validator.operator_address,
        commitBase64,
        stringToBase64(`{"evidence":[]}`),
        "",
    )
    const blockEntryBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(JSON.stringify<wblocks.BlockEntry>(blockEntry))))

    fsm.setContextValue(PROPOSED_HASH_KEY, processReq.hash)
    fsm.setContextValue(PROPOSED_HEADER_KEY, blockHeaderBase64)
    fsm.setContextValue(PROPOSED_BLOCK_KEY, blockEntryBase64)
}

// not used
function appendLogInternalVerified(processReq: typestnd.RequestProcessProposal, header: typestnd.Header, blockCommit: typestnd.BlockCommit): LogEntryAggregate {
    const blockData = JSON.stringify<typestnd.RequestProcessProposal>(processReq);
    const blockDataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(blockData)))
    const blockHeader = JSON.stringify<typestnd.Header>(header);
    const blockHeaderBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(blockHeader)))
    const commit = JSON.stringify<typestnd.BlockCommit>(blockCommit);
    const commitBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(commit)))
    const leaderId = getCurrentNodeId();
    const validator = getValidatorByHexAddr(processReq.proposer_address);
    const contractAddress = encodeBase64(Uint8Array.wrap(wasmx.getAddress()));

    const blockEntry = new wblocks.BlockEntry(
        processReq.height,
        contractAddress,
        contractAddress,
        blockDataBase64,
        blockHeaderBase64,
        validator.operator_address,
        commitBase64,
        stringToBase64(`{"evidence":[]}`),
        "",
    )
    const entry = new LogEntryAggregate(processReq.height, 0, leaderId, blockEntry);
    appendLogEntry(entry);
    return entry
}

function getRandomInRangeI64(min: i64, max: i64): i64 {
    const rand = Math.random()
    const numb = Math.floor(rand * f64((max - min + 1)))
    return i64(numb) + min;
}

function getRandomInRangeI32(min: i32, max: i32): i32 {
    const rand = Math.random()
    const numb = Math.floor(rand * f32((max - min + 1)))
    return i32(numb) + min;
}

export function signMessage(msgstr: string): Base64String {
    const currentState = getCurrentState();
    return wasmxw.ed25519Sign(currentState.validator_privkey, msgstr);
}

export function verifyMessage(nodeIndex: i32, signatureStr: Base64String, msg: string): boolean {
    const nodes = getNodeIPs();
    const addr = nodes[nodeIndex].address;
    const validators = getAllValidators();
    let validator: staking.Validator | null = null;
    for (let i = 0; i < validators.length; i++) {
        if (validators[i].operator_address == addr) {
            validator = validators[i]
        }
    }
    if (validator == null) {
        LoggerDebug("could not verify mesage: validator not found", ["address", addr, "node_index", nodeIndex.toString()])
        return false;
    }
    const pubKey = validator.consensus_pubkey!;
    return wasmxw.ed25519Verify(pubKey.key, signatureStr, msg);
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

function startBlockFinalizationInternal(entryobj: LogEntryAggregate, retry: boolean): boolean {
    const processReqStr = String.UTF8.decode(decodeBase64(entryobj.data.data).buffer);
    const processReq = JSON.parse<typestnd.RequestProcessProposal>(processReqStr);
    const mempool = getMempool();
    mempool.remove(processReq.txs);
    setMempool(mempool);
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
        let resp = wasmxw.call(req);
        if (resp.success > 0) {
            LoggerError("cannot setup next consensus contract", ["new contract", newContract, "err", String.UTF8.decode(decodeBase64(resp.data).buffer)]);
        } else {
            LoggerInfo("next consensus contract is set", ["new contract", newContract])
            newContractSetup = true;

            // stop this contract and any intervals on this contract
            // TODO cancel all intervals on stop() action
            calldata = `{"run":{"event":{"type":"stop","params":[]}}}`
            req = new CallRequest(myaddress, calldata, BigInt.zero(), 100000000, false);
            resp = wasmxw.call(req);
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
    LoggerInfo("block finalized", ["height", entryobj.index.toString()])

    // TODO if we cannot start with the new contract, maybe we should remove its consensus role

    // if consensus changed, start the new contract
    if (newContract != "" && newContractSetup) {
        LoggerInfo("starting new consensus contract", ["address", newContract])
        let calldata = `{"run":{"event":{"type":"prestart","params":[]}}}`
        let req = new CallRequest(newContract, calldata, BigInt.zero(), 100000000, false);
        let resp = wasmxw.call(req);
        if (resp.success > 0) {
            LoggerError("cannot start next consensus contract", ["new contract", newContract, "err", resp.data]);
            // we can restart the old contract here, so the chain does not stop
            const myaddress = wasmxw.addr_humanize(wasmx.getAddress());
            calldata = `{"run":{"event":{"type":"restart","params":[]}}}`
            req = new CallRequest(myaddress, calldata, BigInt.zero(), 100000000, false);
            resp = wasmxw.call(req);
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

function getLastBlockIndex(): i64 {
    const calldatastr = `{"getLastBlockIndex":{}}`;
    const resp = callStorage(calldatastr, false);
    if (resp.success > 0) {
        revert(`could not get last block index`);
    }
    const res = JSON.parse<wblockscalld.LastBlockIndexResult>(resp.data);
    return res.index;
}

function getFinalBlock(index: i64): string {
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

export function updateConsensusParams(updates: typestnd.ConsensusParams): void {
    const params = getConsensusParams();
    if (updates.abci) {
        if (updates.abci.vote_extensions_enable_height) {
            params.abci.vote_extensions_enable_height = updates.abci.vote_extensions_enable_height;
        }
    }
    if (updates.block) {
        if (updates.block.max_bytes) params.block.max_bytes = updates.block.max_bytes;
        if (updates.block.max_gas) params.block.max_gas = updates.block.max_gas;
    }
    if (updates.evidence) {
        if (updates.evidence.max_age_duration) params.evidence.max_age_duration = updates.evidence.max_age_duration;
        if (updates.evidence.max_age_num_blocks) params.evidence.max_age_num_blocks = updates.evidence.max_age_num_blocks;
        if (updates.evidence.max_bytes) params.evidence.max_bytes = updates.evidence.max_bytes;
    }
    if (updates.validator) {
        if (updates.validator.pub_key_types) params.validator.pub_key_types = updates.validator.pub_key_types;
    }
    if (updates.version) {
        if (updates.version.app) params.version.app = updates.version.app;
    }
    setConsensusParams(params);
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

export function setConsensusParams(value: typestnd.ConsensusParams): void {
    const valuestr = JSON.stringify<typestnd.ConsensusParams>(value)
    const calldata = `{"setConsensusParams":{"params":"${encodeBase64(Uint8Array.wrap(String.UTF8.encode(valuestr)))}"}}`
    const resp = callStorage(calldata, false);
    if (resp.success > 0) {
        revert("could not set consensus params");
    }
}


function updateValidators(updates: typestnd.ValidatorUpdate[]): void {
    const calldata = `{"UpdateValidators":{"updates":${JSON.stringify<typestnd.ValidatorUpdate[]>(updates)}}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0) {
        revert("could not update validators");
    }
}

function getValidatorByHexAddr(addr: HexString): staking.Validator {
    const calldata = `{"ValidatorByHexAddr":{"validator_addr":"${addr}"}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0) {
        revert(resp.data);
    }
    if (resp.data === "") {
        revert(`validator not found: ${addr}`)
    }
    LoggerDebug("ValidatorByHexAddr", ["addr", addr, "data", resp.data])
    const result = JSON.parse<staking.QueryValidatorResponse>(resp.data);
    return result.validator;
}

function getAllValidators(): staking.Validator[] {
    const calldata = `{"GetAllValidators":{}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0) {
        revert("could not get validators");
    }
    if (resp.data === "") return [];
    LoggerDebug("GetAllValidators", ["data", resp.data])
    const result = JSON.parse<staking.QueryValidatorsResponse>(resp.data);
    return result.validators;
}

function callStorage(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest("storage", calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

function callStaking(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest("staking", calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

function callHookContract(hookName: string, data: string): void {
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(data)))
    const calldatastr = `{"RunHook":{"hook":"${hookName}","data":"${dataBase64}"}}`;
    const resp = callContract("hooks", calldatastr, false)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`hooks failed`, ["error", resp.data])
    }
}

export function callContract(addr: Bech32String, calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest(addr, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

// TODO some of these validators may be removed, if we use the same raft mechanism
function getRandomSample(k: i32, hash: string, validatorCount: i32, exclude: i32): i32[] {
    // don't loop indefinitely
    if (validatorCount <= k) {
        k = validatorCount - 1; // we exclude ourselves
    }
    let pool = new Array<i32>(validatorCount);
    for (let i = 0; i < validatorCount; i++) {
        pool[i] = i;
    }
    pool.splice(exclude, 1);
    const indexes = new Array<i32>(k);
    for (let i = 0; i < k; i++) {
        // const index = getNextProposerIndex(validatorCount, hash);
        const j = getRandomInRangeI32(0, pool.length - 1);
        const index = pool[j];
        indexes[i] = index;
        pool.splice(j, 1);
    }
    return indexes;
}

function getNextProposerIndex(count: i32, headerHash: string): i32 {
    const votingPower = 50;
    const totalVotingPower = votingPower * count;
    const hashbz = decodeBase64(headerHash);
    const normalizer = Math.pow(2, 32);
    const hashslice = Uint8Array.wrap(hashbz.buffer, 0, 4)
    const part = parseUint8ArrayToU32BigEndian(hashslice)
    const valf = f64(part) / f64(normalizer) * f64(totalVotingPower);
    const val = i64(valf);
    let closestVal: i32 = -1;
    let aggregatedVP: i64[] = new Array<i64>(count);
    let lastSumVP: i64 = 0;
    for (let i = 0; i < count; i++) {
        aggregatedVP[i] = votingPower + lastSumVP;
        lastSumVP = aggregatedVP[i];
        if (aggregatedVP[i] >= val) {
            if (closestVal == -1) {
                closestVal = i;
            } else if (aggregatedVP[i] < aggregatedVP[closestVal]) {
                closestVal = i;
            }
        }
    }
    return closestVal;
}

// block, header
// TODO sign messages!!!
function sendQuery(ip: string, contract: ArrayBuffer, req: QueryResponse): QueryResponse | null {
    LoggerDebug("send query", ["ip", ip]);

    // TODO sign messages!!!
    // const queryMsg = JSON.stringify<QueryResponse>(req)
    // const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(queryMsg)))
    // const signature = signMessage(queryMsg);
    // const msgstr = `{"run":{"event":{"type":"updateNode","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    const msgstr = `{"run":{"event":{"type":"query","params":[{"key": "block","value":"${req.block}"},{"key": "header","value":"${req.header}"}]}}}`
    const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));
    LoggerDebug("query request", ["req", msgstr])

    const response = wasmxw.grpcRequest(ip, Uint8Array.wrap(contract), msgBase64);
    LoggerDebug("query response", ["error", response.error, "data", response.data])
    if (response.error.length > 0 || response.data.length == 0) {
        return null
    }
    return JSON.parse<QueryResponse>(response.data);
}
