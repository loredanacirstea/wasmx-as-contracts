import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { LoggerDebug, LoggerInfo, LoggerError, revert, LoggerDebugExtended } from "./utils";
import {
  Base64String,
  Bech32String,
  CallRequest,
  CallResponse,
} from 'wasmx-env/assembly/types';
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as staking from "wasmx-stake/assembly/types";
import { CurrentState, Mempool } from "./types_blockchain";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { parseInt32, parseInt64, base64ToHex, stringToBase64 } from "wasmx-utils/assembly/utils";
import { LogEntry, LogEntryAggregate, TransactionResponse, AppendEntry, AppendEntryResponse, VoteResponse, VoteRequest, NodeUpdate, UpdateNodeResponse, MODULE_NAME } from "./types_raft";
import { BigInt } from "wasmx-env/assembly/bn";
import { appendLogEntry, getCommitIndex, getCurrentNodeId, getCurrentState, getLastLogIndex, getLogEntryObj, getMatchIndexArray, getMempool, getNextIndexArray, getNodeCount, getNodeIPs, getTermId, getVoteIndexArray, hasVotedFor, removeLogEntry, setCommitIndex, setCurrentNodeId, setCurrentState, setElectionTimeout, setLastApplied, setLastLogIndex, setMatchIndexArray, setMempool, setNextIndexArray, setNodeIPs, setTermId, setVoteIndexArray, setVotedFor } from "./storage";
import * as cfg from "./config";
import { callHookContract, checkValidatorsUpdate, getAllValidators,getBlockID,getConsensusParams, getCurrentValidator, getFinalBlock, getLastBlockIndex, getLastLog, getMajority, getRandomInRange, initChain, initializeIndexArrays, setFinalizedBlock, signMessage, updateConsensusParams, updateValidators, verifyMessage, verifyMessageByAddr } from "./action_utils";
import { extractIndexedTopics, getCommitHash, getConsensusParamsHash, getEvidenceHash, getHeaderHash, getResultsHash, getTxsHash, getValidatorsHash } from "wasmx-consensus-utils/assembly/utils"
import { NetworkNode, NodeInfo } from "wasmx-p2p/assembly/types";

// Docs: https://raft.github.io/raft.pdf

export function registeredCheck(
    params: ActionParam[],
    event: EventObject,
): void {
    // when a node starts, it needs to add itself to the pack
    // we just need [ourIP, leaderIP]

    const ips = getNodeIPs();
    const needed = registeredCheckNeeded(ips);
    if (!needed) return;

    const nodeId = getCurrentNodeId();
    const nodeInfo = ips[nodeId];

    const msgstr = registeredCheckMessage(ips, nodeId);
    const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));
    LoggerInfo("register request", ["req", msgstr])

    // we send the request to the same contract
    const contract = wasmx.getAddress();

    for (let i = 0; i < ips.length; i++) {
        // don't send to ourselves or to removed nodes
        if (i == nodeId || ips[i].node.ip == "") continue;
        LoggerInfo("register request", ["IP", ips[i].node.ip, "address", ips[i].address])
        const response = wasmxw.grpcRequest(ips[i].node.ip, Uint8Array.wrap(contract), msgBase64);
        LoggerInfo("register response", ["error", response.error, "data", response.data])
        if (response.error.length > 0 || response.data.length == 0) {
            return
        }
        const resp = JSON.parse<UpdateNodeResponse>(response.data);

        // we find our id
        let ourId = -1;
        for (let j = 0; j < resp.nodes.length; j++) {
            if (resp.nodes[j].address == nodeInfo.address) {
                ourId = j;
                break;
            }
        }
        if (ourId != -1) {
            const node = resp.nodes[ourId];
            if (node.node.host != nodeInfo.node.host) {
                LoggerError("node list contains wrong host data", ["address", nodeInfo.address, "id", ourId.toString(), "actual", node.node.host, "expected", nodeInfo.node.host])
                continue;
            }
            if (node.node.id != nodeInfo.node.id) {
                LoggerError("node list contains wrong id data", ["address", nodeInfo.address, "id", ourId.toString(), "actual", node.node.id, "expected", nodeInfo.node.id])
                continue;
            }
            if (node.node.ip != nodeInfo.node.ip) {
                LoggerError("node list contains wrong ip data", ["address", nodeInfo.address, "id", ourId.toString(), "actual", node.node.ip, "expected", nodeInfo.node.ip])
                continue;
            }
            if (node.node.port != nodeInfo.node.port) {
                LoggerError("node list contains wrong port data", ["address", nodeInfo.address, "id", ourId.toString(), "actual", node.node.port, "expected", nodeInfo.node.port])
                continue;
            }
            setCurrentNodeId(ourId);
            setNodeIPs(resp.nodes);
            // we can stop here and not query other nodes
            break;
        }
    }
}

export function registeredCheckNeeded(ips: NodeInfo[]): boolean {
    // when a node starts, it needs to add itself to the pack
    // we just need [ourIP, leaderIP]

    // if blocks, return
    const lastIndex = getLastLogIndex();
    if (lastIndex > cfg.LOG_START) {
        return false;
    }
    // if we are alone, return
    if (ips.length == 1) {
        return false;
    }
    // we have tried to become leader 2 times
    const termId = getTermId();
    if (termId < 2) {
        return false;
    }
    return true;
}

export function registeredCheckMessage(ips: NodeInfo[], nodeId: i32): string {
    LoggerInfo("trying to register node IP with Leader", []);

    // send updateNode to all ips except us
    const nodeIp = ips[nodeId];
    // TODO signature on protobuf encoding, not JSON
    const updateMsg = new NodeUpdate(nodeIp, nodeId, cfg.NODE_UPDATE_ADD);
    const updateMsgStr = JSON.stringify<NodeUpdate>(updateMsg);
    const signature = signMessage(updateMsgStr);

    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(updateMsgStr)));
    const msgstr = `{"run":{"event":{"type":"updateNode","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    LoggerInfo("register request", ["req", msgstr])
    return msgstr
}

// Leader node receives a node update from a node and sends
// the updated list of nodes to all validators
// TODO right now we only send to the validators who sent us the update
// p2p version sends to all
export function updateNodeAndReturn(
    params: ActionParam[],
    event: EventObject,
): void {
    let entry = extractUpdateNodeEntryAndVerify(params, event);
    const response = updateNodeEntry(entry);
    wasmx.setFinishData(String.UTF8.encode(JSON.stringify<UpdateNodeResponse>(response)));
}

export function extractUpdateNodeEntryAndVerify(
    params: ActionParam[],
    event: EventObject,
): NodeUpdate {
    let entryBase64: string = "";
    let signature: string = "";
    for (let i = 0; i < event.params.length; i++) {
        if (event.params[i].key === "entry") {
            entryBase64 = event.params[i].value;
            continue;
        }
        if (event.params[i].key === "signature") {
            signature = event.params[i].value;
            continue;
        }
    }
    if (entryBase64 === "") {
        revert("updateNodeAndReturn: empty entry");
    }
    if (signature === "") {
        revert("updateNodeAndReturn: empty signature");
    }
    const entryStr = String.UTF8.decode(decodeBase64(entryBase64).buffer);
    LoggerDebug("updateNodeAndReturn", ["entry", entryStr, "signature", signature])
    let entry: NodeUpdate = JSON.parse<NodeUpdate>(entryStr);

    LoggerInfo("update node", ["ip", entry.node.node.ip, "type", entry.type.toString(), "index", entry.index.toString(), "address", entry.node.address])

    if (!entry.node || !entry.node.address) {
        revert("node update failed, address missing");
    }
    // verify signature
    const isSender = verifyMessageByAddr(entry.node.address, signature, entryStr);
    if (!isSender) {
        revert(`signature verification failed: address ${entry.node.address}`);
    }
    return entry;
}

export function updateNodeEntry(entry: NodeUpdate): UpdateNodeResponse {
    let ips = getNodeIPs();

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
        // we reset these values
        // a node coming back online will send updated indexes later
        const nextIndexes = getNextIndexArray();
        const matchIndexes = getMatchIndexArray();
        nextIndexes.push(cfg.LOG_START + 1);
        matchIndexes.push(cfg.LOG_START);
        setNextIndexArray(nextIndexes);
        setMatchIndexArray(matchIndexes);
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
    setNodeIPs(ips);
    return new UpdateNodeResponse(ips, getCurrentNodeId(), getLastLogIndex());
}

export function removeNode(nodes: NodeInfo[], index: i32): NodeInfo[] {
    nodes[index].node.ip = "";
    nodes[index].node.host = "";
    nodes[index].node.port = "";
    return nodes;
}

// forward transactions to leader
export function forwardTxsToLeader(
    params: ActionParam[],
    event: EventObject,
): void {
    // look in the mempool to see if we have user transactions left
    // and send to leader
    const mempool = getMempool();
    if (mempool.txs.length == 0) {
        return;
    }

    // get leader from last log
    const entry = getLastLog();
    if (entry.index == 0) {
        return;
    }
    const nodeId = entry.leaderId;
    const nodeIps = getNodeIPs();
    const nodeIp = nodeIps[nodeId];
    const contract = wasmx.getAddress();

    let limit = mempool.txs.length;
    if (limit > 5) {
        limit = 5;
    }
    const txs = mempool.txs.slice(0, limit);
    LoggerDebug("forwarding txs to leader", ["nodeId", nodeId.toString(), "nodeIp", nodeIp.node.ip, "count", limit.toString()])

    for (let i = 0; i < limit; i++) {
        const tx = txs[0];
        const msgstr = `{"run":{"event":{"type":"newTransaction","params":[{"key": "transaction","value":"${tx}"}]}}}`
        const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));
        const response = wasmxw.grpcRequest(nodeIp.node.ip, Uint8Array.wrap(contract), msgBase64);
        LoggerDebug("forwarding tx to leader", ["nodeId", nodeId.toString(), "nodeIp", nodeIp.node.ip, "batch", i.toString(), "error", response.error])

        if (response.error.length == 0) {
            mempool.txs.splice(i, 1);
            continue;
        }
        // this may happen even if we check when we receive the tx
        if (response.error.includes(cfg.ERROR_INVALID_TX)) {
            mempool.txs.splice(i, 1);
            LoggerDebug("forwarded invalid transaction", ["tx", tx]);
        } else {
            // leader is not ready, we return
            break;
        }
    }

    setMempool(mempool);
}

export function initializeNextIndex(
    params: ActionParam[],
    event: EventObject,
): void {
    const lastIndex = getLastLogIndex();
    const nextIndex = lastIndex + 1;
    const nextIndexes = getNextIndexArray();
    for (let i = 0; i < nextIndexes.length; i++) {
        nextIndexes[i] = nextIndex;
    }
    setNextIndexArray(nextIndexes);
}

export function initializeMatchIndex(
    params: ActionParam[],
    event: EventObject,
): void {
    const matchIndexes = getMatchIndexArray();
    for (let i = 0; i < matchIndexes.length; i++) {
        matchIndexes[i] = 0;
    }
    setMatchIndexArray(matchIndexes);
}

export function setRandomElectionTimeout(
    params: ActionParam[],
    event: EventObject,
): void {
    let min: string = "";
    let max: string = "";
    if (params.length == 0) {
        params = event.params;
    }
    for (let i = 0; i < params.length; i++) {
        if (params[i].key === "min") {
            min = params[i].value;
            continue;
        }
        if (params[i].key === "max") {
            max = params[i].value;
            continue;
        }
    }
    if (min === "") {
        revert("no min found");
    }
    if (max === "") {
        revert("no max found");
    }
    const min_ = parseInt64(min)
    const max_ = parseInt64(max)
    setElectionTimeout(getRandomInRange(min_, max_));
}

// received vote request
export function vote(
    params: ActionParam[],
    event: EventObject,
): void {
    let entryBase64: string = "";
    let signature: string = "";
    for (let i = 0; i < event.params.length; i++) {
        if (event.params[i].key === "entry") {
            entryBase64 = event.params[i].value;
            continue;
        }
        if (event.params[i].key === "signature") {
            signature = event.params[i].value;
            continue;
        }
    }
    if (entryBase64 === "") {
        revert("vote: empty entry");
    }
    if (signature === "") {
        revert("vote: empty signature");
    }
    const entryStr = String.UTF8.decode(decodeBase64(entryBase64).buffer);
    let entry: VoteRequest = JSON.parse<VoteRequest>(entryStr);
    // verify signature
    const isSender = verifyMessage(entry.candidateId, signature, entryStr);
    if (!isSender) {
        LoggerError("signature verification failed for VoteRequest", ["candidateId", entry.candidateId.toString(), "termId", entry.termId.toString()]);
        // TODO have an error for the grpc vote request
        return;
    }

    const response = voteInternal(entry.termId, entry.candidateId, entry.lastLogIndex, entry.lastLogTerm);
    wasmx.setFinishData(String.UTF8.encode(JSON.stringify<VoteResponse>(response)));
}

export function incrementCurrentTerm(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId();
    setTermId(termId + 1);
}

export function selfVote(
    params: ActionParam[],
    event: EventObject,
): void {
    const myId = getCurrentNodeId();
    setVotedFor(myId);
    // initialize voting array for this node's election cycle
    const ips = getNodeIPs();
    const voteArray = new Array<i32>(ips.length);
    for (let i = 0; i < ips.length; i++) {
        voteArray[i] = 0;
    }
    voteArray[myId] = 1;
    setVoteIndexArray(voteArray);
}

export function sendVoteRequests(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId();
    const candidateId = getCurrentNodeId();
    const lastLogIndex = getLastLogIndex();
    const lastEntry = getLastLog();
    const lastLogTerm = lastEntry.termId;

    // iterate through the other nodes and send a VoteRequest
    const request = new VoteRequest(termId, candidateId, lastLogIndex, lastLogTerm);
    const ips = getNodeIPs();
    if (ips.length > 1) {
        LoggerInfo("sending vote requests...", ["candidateId", candidateId.toString(), "termId", termId.toString(), "lastLogIndex", lastLogIndex.toString(), "lastLogTerm", lastLogTerm.toString(), "ips", JSON.stringify<Array<NodeInfo>>(ips)])
    }
    for (let i = 0; i < ips.length; i++) {
        // don't send to ourselves or to removed nodes
        if (candidateId === i || !isNodeActive(ips[i])) continue;
        sendVoteRequest(i, ips[i], request, termId);
    }
}

export function isNodeActive(node: NodeInfo): bool {
    return !node.outofsync && (node.node.ip != "" || node.node.host != "")
}

function sendVoteRequest(nodeId: i32, node: NodeInfo, request: VoteRequest, termId: i32): void {
    const datastr = JSON.stringify<VoteRequest>(request);
    const signature = signMessage(datastr);

    // const msgstr = `{"run":{"event":{"type":"receiveVoteRequest","params":[{"key":"termId","value":"${request.termId.toString()}"},{"key":"candidateId","value":"${request.candidateId.toString()}"},{"key":"lastLogIndex","value":"${request.lastLogIndex.toString()}"},{"key":"lastLogTerm","value":"${request.lastLogTerm.toString()}"}]}}}`
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveVoteRequest","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));

    const contract = wasmx.getAddress();
    LoggerDebug("sending vote request", ["nodeId", nodeId.toString(), "nodeIp", node.node.ip, "termId", termId.toString(), "data", datastr])
    const response = wasmxw.grpcRequest(node.node.ip, Uint8Array.wrap(contract), msgBase64);
    LoggerDebug("vote request response", ["nodeId", nodeId.toString(), "nodeIp", node.node.ip, "termId", termId.toString(), "data", response.data, "error", response.error])
    if (response.error.length > 0 || response.data.length == 0) {
        return
    }

    const resp = JSON.parse<VoteResponse>(response.data);
    // if vote granted, add to the votes and check that we have majority
    if (resp.voteGranted) {
        const voteArray = getVoteIndexArray();
        voteArray[nodeId] = 1;
        setVoteIndexArray(voteArray);
    } else {
        // update our termId if we are behind
        if (resp.termId > termId) {
            setTermId(resp.termId);
        }
        // TODO do we need to rollback entries?
    }
}

// TODO lastLogTerm
export function voteInternal(termId: i32, candidateId: i32, lastLogIndex: i64, lastLogTerm: i32): VoteResponse {
    const mytermId = getTermId();
    let response = new VoteResponse(mytermId, true);
    const nodes = getNodeIPs();
    // we don't vote on outofsync candidates
    if (!isNodeActive(nodes[candidateId])) {
        response = new VoteResponse(mytermId, false);
    } else if (termId < mytermId) {
        response = new VoteResponse(mytermId, false);
    } else if (termId > mytermId) {
        // TODO what now?
        // this vote request should override what we have
        // TODO - we need to rollback uncommited changes from mytermId to termId
        // update termId & votedFor
        setTermId(termId);
        setVotedFor(candidateId);
        response = new VoteResponse(termId, true);
        LoggerInfo("voting for Candidate", ["candidateId", candidateId.toString(), "termId", termId.toString()])
    } else {
        // if we already voted, we do not grant a new vote
        if (hasVotedFor()) {
            response = new VoteResponse(mytermId, false);
        } else {
            // candidate’s log is at least as up-to-date as receiver’s log
            const lastIndex = getLastLogIndex();
            if (lastLogIndex < lastIndex) {
                LoggerDebug("candidate is not up-to-date", ["candidateLastIndex", lastLogIndex.toString(), "ourLastIndex", lastIndex.toString(), "candidateId", candidateId.toString()])
                response = new VoteResponse(mytermId, false);
            } else {
                setVotedFor(candidateId);
                LoggerInfo("voting for Candidate", ["candidateId", candidateId.toString(), "termId", termId.toString()])
            }
        }
    }
    return response
}

export function setupNode(
    params: ActionParam[],
    event: EventObject,
): void {
    let initChainSetup: string = "";
    for (let i = 0; i < event.params.length; i++) {
        if (event.params[i].key === "data") {
            initChainSetup = event.params[i].value;
            continue;
        }
    }
    if (initChainSetup === "") {
        revert("no initChainSetup found");
    }

    // TODO ID@host:ip
    // 6efc12ab37fc0e096d8618872f6930df53972879@0.0.0.0:26757

    setCommitIndex(cfg.LOG_START);
    setLastApplied(cfg.LOG_START);

    const datajson = String.UTF8.decode(decodeBase64(initChainSetup).buffer);
    // TODO remove validator private key from logs in initChainSetup
    LoggerDebug("setupNode", ["initChainSetup", datajson])
    const data = JSON.parse<typestnd.InitChainSetup>(datajson);
    fsm.setContextValue(cfg.CURRENT_NODE_ID, data.node_index.toString());

    const peers = new Array<NodeInfo>(data.peers.length);
    for (let i = 0; i < data.peers.length; i++) {
        const peer = data.peers[i].split("@");
        if (peer.length != 2) {
            revert(`invalid node format; found: ${data.peers[i]}`)
        }
        peers[i] = new NodeInfo(peer[0], new NetworkNode("","","",peer[1]), false);
    }
    setNodeIPs(peers);
    initChain(data);
    initializeIndexArrays(peers.length);
}
export function processAppendEntries(
    params: ActionParam[],
    event: EventObject,
): void {
    // here we receive new entries/logs/blocks
    // we need to run ProcessProposal on each block
    // and then FinalizeBlock & Commit
    // TODO we also look at termId, as we might need to rollback changes in case of a network split
    let entryBase64: string = "";
    let signature: string = "";
    for (let i = 0; i < event.params.length; i++) {
        if (event.params[i].key === "entry") {
            entryBase64 = event.params[i].value;
            continue;
        }
        if (event.params[i].key === "signature") {
            signature = event.params[i].value;
            continue;
        }
    }
    if (entryBase64 === "") {
        revert("update node: empty entry");
    }
    if (signature === "") {
        revert("update node: empty signature");
    }
    const entryStr = String.UTF8.decode(decodeBase64(entryBase64).buffer);
    LoggerDebugExtended("received new entries", ["AppendEntry", entryStr]);

    let entry: AppendEntry = JSON.parse<AppendEntry>(entryStr);
    // verify signature
    const isSender = verifyMessage(entry.leaderId, signature, entryStr);
    if (!isSender) {
        LoggerError("signature verification failed for AppendEntry", ["leaderId", entry.leaderId.toString(), "termId", entry.termId.toString()]);
        return;
    }

    LoggerInfo("received new entries", [
        "leaderId", entry.leaderId.toString(),
        "termId", entry.termId.toString(),
        "leaderCommit", entry.leaderCommit.toString(),
        "prevLogIndex", entry.prevLogIndex.toString(),
        "prevLogTerm", entry.prevLogTerm.toString(),
        "count", entry.entries.length.toString(),
        "nodeIps", entry.nodeIps.length.toString(),
    ]);

    // update our nodeips
    const ips = getNodeIPs();
    const nodeId = getCurrentNodeId();
    const nodeIp = ips[nodeId];
    // check that our nodeId is still in line
    let newId = nodeId;
    for(let i = 0; i < entry.nodeIps.length; i++) {
        if (entry.nodeIps[i].address == nodeIp.address) {
            newId = i;
            break;
        }
    }
    if (newId != nodeId) {
        LoggerDebug("our node ID has changed", ["old", nodeId.toString(), "new", newId.toString()])
        setCurrentNodeId(newId);
    }
    setNodeIPs(entry.nodeIps);
    setTermId(entry.termId);

    // we commit as close to the transition end as possible
    // we make sure to commit the last block before running ProcessProposal on the new block
    // TODO
    // entry.leaderId ?
    const lastCommitIndex = getCommitIndex();
    const lastLogIndex = getLastLogIndex();
    const maxCommitIndex = i64(Math.min(f64(lastLogIndex), f64(entry.leaderCommit)));
    for (let i = lastCommitIndex + 1; i <= maxCommitIndex; i++) {
        startBlockFinalizationFollower(i);
        setCommitIndex(i);
        setLastApplied(i);
    }

    // now we check the new block
    for (let i = 0; i < entry.entries.length; i++) {
        processAppendEntry(entry.entries[i]);
    }
    LoggerDebug("new entries processing finished", [
        "leaderId", entry.leaderId.toString(),
        "leaderCommit", entry.leaderCommit.toString(),
        "prevLogIndex", entry.prevLogIndex.toString(),
        "count", entry.entries.length.toString(),
    ]);
}

export function processAppendEntry(entry: LogEntryAggregate): void {
    const data = decodeBase64(entry.data.data);
    const processReq = JSON.parse<typestnd.RequestProcessProposal>(String.UTF8.decode(data.buffer));

    const processResp = consensuswrap.ProcessProposal(processReq);
    if (processResp.status === typestnd.ProposalStatus.REJECT) {
        // TODO - what to do here? returning just discards the block and does not return a response to the leader
        // but this node will not sync with the leader anymore
        LoggerError("new block rejected", ["height", processReq.height.toString(), "node type", "Follower"])
        return;
    }
    appendLogEntry(entry);
}

export function sendHeartbeatResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const entry = extractAppendEntry(params, event)
    const response = prepareHeartbeatResponse(entry)
    wasmx.setFinishData(String.UTF8.encode(JSON.stringify<AppendEntryResponse>(response)));
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

export function prepareHeartbeatResponse(entry: AppendEntry): AppendEntryResponse {
    const termId = getTermId();
    const lastLogIndex = getLastLogIndex();
    let successful = true;
    for (let i = 0; i < entry.entries.length; i++) {
        if (entry.entries[i].index > lastLogIndex) {
            successful = false;
            break;
        }
    }
    const response = new AppendEntryResponse(termId, successful, lastLogIndex);
    LoggerDebug("send heartbeat response", ["termId", termId.toString(), "success", "true", "lastLogIndex", lastLogIndex.toString()])
    return response
}

export function sendAppendEntries(
    params: ActionParam[],
    event: EventObject,
): void {
    // go through each node
    const nodeId = getCurrentNodeId();
    const ips = getNodeIPs();
    LoggerDebug("diseminate entries...", ["nodeId", nodeId.toString(), "ips", JSON.stringify<Array<NodeInfo>>(ips)])
    for (let i = 0; i < ips.length; i++) {
        // don't send to Leader or removed nodes
        if (nodeId === i || !isNodeActive(ips[i])) continue;
        sendAppendEntry(i, ips[i], ips);
    }
}

// this actually commits one block at a time
export function commitBlocks(
    params: ActionParam[],
    event: EventObject,
): void {
    const consensusChanged = checkCommits();
    if(consensusChanged) {
        // we need to also propagate the commit of this entry to the rest of the nodes
        // so they can enter the new consensus
        sendAppendEntries([], new EventObject("", []))
    }
}

// this gets called each reentry in Leader.active state
export function checkCommits(): boolean {
    const lastCommitIndex = getCommitIndex();
    // all commited + uncommited logs
    const lastLogIndex = getLastLogIndex();
    const nextIndexPerNode = getNextIndexArray();
    const len = getNodeCount();
    let nextCommit = lastCommitIndex + 1;

    LoggerDebug("committing diseminated blocks...", ["lastCommitIndex", lastCommitIndex.toString(), "lastSaved", lastLogIndex.toString(), "blocksToCommit", (lastLogIndex >= nextCommit).toString()])

    if (lastLogIndex < nextCommit) {
        return false;
    }
    const majority = getMajority(len);
    let count = 1; // leader
    for (let i = 0; i < len; i++) {
        // next index is the next index to send, so we use >
        if (nextIndexPerNode.at(i) > nextCommit) {
            count += 1;
        }
    }
    const committing = count >= majority;
    LoggerDebug("committing diseminated block", ["height", nextCommit.toString(), "nodes_count", len.toString(), "nodes_received", count.toString(), "committing", committing.toString()])

    // TODO If AppendEntries fails because of log inconsistency: decrement nextIndex and retry
    if (committing) {
        // TODO commit only if entry.term == currentTerm:

        // We commit the state
        const consensusChanged = startBlockFinalizationLeader(nextCommit);
        // update last commited!
        setCommitIndex(nextCommit);
        setLastApplied(nextCommit);
        return consensusChanged;
    }
    return false;
}

// TODO continue sending the entries until all nodes receive them
// TODO make this an eventual and retry until responses are received or leader is changed
export function sendAppendEntry(
    nodeId: i32,
    node: NodeInfo,
    nodeIps: NodeInfo[],
): void {
    const nextIndexPerNode = getNextIndexArray();
    const nextIndex = nextIndexPerNode.at(nodeId);
    const lastIndex = getLastLogIndex();
    let lastIndexToSend = lastIndex

    // right now, don't send more than STATE_SYNC_BATCH blocks at a time
    if ((lastIndex - nextIndex) > cfg.STATE_SYNC_BATCH) {
        lastIndexToSend = nextIndex + cfg.STATE_SYNC_BATCH;
    }
    const data = prepareAppendEntry(nodeIps, nextIndex, lastIndexToSend);
    const msgstr = prepareAppendEntryMessage(nodeId, nextIndex, lastIndex, lastIndexToSend,node, data);
    const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));

    // we send the request to the same contract
    const contract = wasmx.getAddress();
    const response = wasmxw.grpcRequest(node.node.ip, Uint8Array.wrap(contract), msgBase64);
    if (response.error.length > 0) {
        return
    }
    const resp = JSON.parse<AppendEntryResponse>(response.data);
    // TODO something with resp.term
    if (resp.success) {
        const nextIndexPerNode = getNextIndexArray();
        const nextIndex = nextIndexPerNode.at(nodeId);
        nextIndexPerNode[nodeId] = nextIndex + data.entries.length;
        setNextIndexArray(nextIndexPerNode);
    }
}

export function prepareAppendEntry(
    nodeIps: NodeInfo[],
    nextIndex: i64,
    lastIndex: i64,
): AppendEntry {
    const entries: Array<LogEntryAggregate> = [];
    for (let i = nextIndex; i <= lastIndex; i++) {
        const entry = getLogEntryAggregate(i);
        entries.push(entry);
    }
    const previousEntry = getLogEntryObj(nextIndex-1);
    const lastCommitIndex = getCommitIndex();
    const data = new AppendEntry(
        getTermId(),
        getCurrentNodeId(),
        nextIndex - 1,
        previousEntry.termId,
        entries,
        lastCommitIndex,
        nodeIps,
    )
    return data;
}

export function prepareAppendEntryMessage(
    nodeId: i32,
    nextIndex: i64,
    lastIndex: i64,
    lastIndexToSend: i64,
    node: NodeInfo,
    data: AppendEntry,
): string {
    const datastr = JSON.stringify<AppendEntry>(data);
    const signature = signMessage(datastr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveHeartbeat","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`

    LoggerDebug("diseminate append entry...", ["nodeId", nodeId.toString(), "receiver", node.address, "count", data.entries.length.toString(), "from", nextIndex.toString(), "to", lastIndexToSend.toString(), "last_index", lastIndex.toString()])
    return msgstr
}

export function sendNewTransactionResponse(
    params: ActionParam[],
    event: EventObject,
): void {

    const entry = getLastLog();
    const response = new TransactionResponse(
        entry.termId,
        entry.leaderId,
        entry.index,
    );
    wasmx.setFinishData(String.UTF8.encode(JSON.stringify<TransactionResponse>(response)));
}

export function addToMempool(
    params: ActionParam[],
    event: EventObject,
): void {
    let transaction: string = "";
    for (let i = 0; i < event.params.length; i++) {
        if (event.params[i].key === "transaction") {
            transaction = event.params[i].value;
            continue;
        }
    }
    if (transaction === "") {
        revert("no transaction found");
    }
    LoggerDebug("new transaction received", ["transaction", transaction])
    return addTransactionToMempool(transaction)
}

export function proposeBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    // if last block is not commited, we return; Cosmos SDK can only commit one block at a time.
    const height = getLastLogIndex();
    const lastCommitIndex = getCommitIndex();
    if (lastCommitIndex < height) {
        LoggerInfo("cannot propose new block, last block not commited", ["height", height.toString(), "lastCommitIndex", lastCommitIndex.toString()])
        return;
    }

    const mempool = getMempool();
    const cparams = getConsensusParams(0);
    let maxbytes = cparams.block.max_bytes;
    if (maxbytes == -1) {
        maxbytes = cfg.MaxBlockSizeBytes;
    }
    const batch = mempool.batch(cparams.block.max_gas, maxbytes);
    LoggerDebug("batch transactions", ["count", batch.txs.length.toString()])

    // TODO
    // maxDataBytes := types.MaxDataBytes(maxBytes, evSize, state.Validators.Size())
    const maxDataBytes = maxbytes;

    // start proposal protocol
    startBlockProposal(batch.txs, batch.cummulatedGas, maxDataBytes);
    setMempool(mempool);
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

export function addTransactionToMempool(
    transaction: string, // base64
): void {
    // check that tx is valid
    const checktx = new typestnd.RequestCheckTx(transaction, typestnd.CheckTxType.New);
    const checkResp = consensuswrap.CheckTx(checktx);
    // we only check the code type; CheckTx should be stateless, just form checking
    if (checkResp.code !== typestnd.CodeType.Ok) {
        // transaction is not valid, we should finish; we use this error to check forwarded txs to leader
        return revert(`${cfg.ERROR_INVALID_TX}; code ${checkResp.code}; ${checkResp.log}`);
    }

    // add to mempool
    const mempool = getMempool();
    // TODO actually decode tx
    // const parsedTx = decodeTx(transaction);
    const parsedTx =  new typestnd.Transaction(15000000);
    const cparams = getConsensusParams(0);
    const maxgas = cparams.block.max_gas;
    if (maxgas > -1 && maxgas < parsedTx.gas) {
        return revert(`out of gas: ${parsedTx.gas}; max ${maxgas}`);
    }
    mempool.add(transaction, parsedTx.gas);
    setMempool(mempool);
}

function startBlockProposal(txs: string[], cummulatedGas: i64, maxDataBytes: i64): void {
    // PrepareProposal TODO finish
    const height = getLastLogIndex() + 1;
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
        new typestnd.VersionConsensus(typestnd.BlockProtocol, currentState.version.consensus.app),
        currentState.chain_id,
        prepareReq.height,
        prepareReq.time,
        currentState.last_block_id,
        base64ToHex(getCommitHash(lastBlockCommit)),
        base64ToHex(getTxsHash(prepareResp.txs)),
        base64ToHex(nextValidatorsHash),
        base64ToHex(nextValidatorsHash),
        base64ToHex(getConsensusParamsHash(getConsensusParams(prepareReq.height))),
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
    return appendLogInternalVerified(processReq, header, lastBlockCommit);
}

function startBlockFinalizationLeader(index: i64): boolean {
    LoggerInfo("start block finalization", ["height", index.toString()])
    // get entry and apply it
    const entryobj = getLogEntryAggregate(index);
    LoggerDebug("start block finalization", ["height", index.toString(), "leaderId", entryobj.leaderId.toString(), "termId", entryobj.termId.toString(), "data", JSON.stringify<wblocks.BlockEntry>(entryobj.data)])

    const currentTerm = getTermId();
    if (currentTerm == entryobj.termId) {
        return startBlockFinalizationInternal(entryobj, false);
    } else {
        LoggerError("entry has current term mismatch", ["nodeType", "Leader", "currentTerm", currentTerm.toString(), "entryTermId", entryobj.termId.toString()])
        return false;
    }
}

function startBlockFinalizationFollower(index: i64): boolean {
    LoggerInfo("start block finalization", ["height", index.toString()])
    // get entry and apply it
    const entryobj = getLogEntryAggregate(index);
    LoggerDebug("start block finalization", ["height", index.toString(), "leaderId", entryobj.leaderId.toString(), "termId", entryobj.termId.toString(), "data", JSON.stringify<wblocks.BlockEntry>(entryobj.data)])
    return startBlockFinalizationInternal(entryobj, false);
}

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
    let respWrap = consensuswrap.FinalizeBlock(new typestnd.WrapRequestFinalizeBlock(finalizeReq, new Map<string,Base64String>()));
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
    state.last_block_id = getBlockID(finalizeReq.hash)

    state.last_commit_hash = last_commit_hash
    state.last_results_hash = last_results_hash
    setCurrentState(state);
    // update consensus params
    LoggerDebug("updating consensus parameters...", [])
    const consensusUpd = finalizeResp.consensus_param_updates
    if (consensusUpd != null) {
        updateConsensusParams(finalizeReq.height, consensusUpd);
    }
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
        let resp = wasmxw.call(req, MODULE_NAME);
        if (resp.success > 0) {
            LoggerError("cannot setup next consensus contract", ["new contract", newContract, "err", resp.data]);
        } else {
            LoggerInfo("next consensus contract is set", ["new contract", newContract])
            newContractSetup = true;

            // stop this contract and any intervals on this contract
            // TODO cancel all intervals on stop() action
            calldata = `{"run":{"event":{"type":"stop","params":[]}}}`
            req = new CallRequest(myaddress, calldata, BigInt.zero(), 100000000, false);
            resp = wasmxw.call(req, MODULE_NAME);
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
    LoggerInfo("block finalized", ["height", entryobj.index.toString(), "hash", base64ToHex(finalizeReq.hash).toUpperCase()])

    // TODO if we cannot start with the new contract, maybe we should remove its consensus role

    // if consensus changed, start the new contract
    if (newContract != "" && newContractSetup) {
        LoggerInfo("starting new consensus contract", ["address", newContract])
        let calldata = `{"run":{"event":{"type":"prestart","params":[]}}}`
        let req = new CallRequest(newContract, calldata, BigInt.zero(), 100000000, false);
        let resp = wasmxw.call(req, MODULE_NAME);
        if (resp.success > 0) {
            LoggerError("cannot start next consensus contract", ["new contract", newContract, "err", resp.data]);
            // we can restart the old contract here, so the chain does not stop
            const myaddress = wasmxw.addr_humanize(wasmx.getAddress());
            calldata = `{"run":{"event":{"type":"restart","params":[]}}}`
            req = new CallRequest(myaddress, calldata, BigInt.zero(), 100000000, false);
            resp = wasmxw.call(req, MODULE_NAME);
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

export function isVotedLeader(
    params: ActionParam[],
    event: EventObject,
): boolean {
    // check if we have a vote majority
    const voteArray = getVoteIndexArray();
    let count = 0;
    for (let i = 0; i < voteArray.length; i++) {
        count += voteArray[i];
    }
    const len = getNodeCount();
    const majority = getMajority(len);
    LoggerDebug("check if is voted Leader", ["yes", count.toString(), "total_votes", len.toString(), "majority", majority.toString()])
    return count >= majority;
}

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

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

    let calldata = `{"getContextValue":{"key":"${cfg.NODE_IPS}"}}`
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
    resp = wasmxw.call(req, MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get state from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up state", ["data", data])
    const state = JSON.parse<CurrentState>(data)
    setCurrentState(state);

    calldata = `{"getContextValue":{"key":"mempool"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    resp = wasmxw.call(req, MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get mempool from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up mempool", ["data", data])
    const mempool = JSON.parse<Mempool>(data)
    setMempool(mempool);

    calldata = `{"getContextValue":{"key":"currentNodeId"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    resp = wasmxw.call(req, MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get currentNodeId from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up currentNodeId", ["data", data])
    const currentNodeId = parseInt32(data);
    setCurrentNodeId(currentNodeId);

    calldata = `{"getContextValue":{"key":"currentTerm"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    resp = wasmxw.call(req, MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get currentTerm from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up currentTerm", ["data", data])
    const currentTerm = parseInt32(data);
    setTermId(currentTerm);

    // get last block index from storage contract
    const lastIndex = getLastBlockIndex();
    LoggerInfo("setting up last log index", ["index", lastIndex.toString()])
    setLastLogIndex(lastIndex);
    setCommitIndex(lastIndex);

    // after we set last log index
    initializeIndexArrays(nodeIps.length);

    // TODO we run the hooks that must be ran after block end
    const blockData = getFinalBlock(getLastBlockIndex())
    callHookContract("EndBlock", blockData);
}


function appendLogInternalVerified(processReq: typestnd.RequestProcessProposal, header: typestnd.Header, blockCommit: typestnd.BlockCommit): void {
    const blockData = JSON.stringify<typestnd.RequestProcessProposal>(processReq);
    const blockDataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(blockData)))
    const blockHeader = JSON.stringify<typestnd.Header>(header);
    const blockHeaderBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(blockHeader)))
    const commit = JSON.stringify<typestnd.BlockCommit>(blockCommit);
    const commitBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(commit)))
    const termId = getTermId();
    const leaderId = getCurrentNodeId();

    const contractAddress = encodeBase64(Uint8Array.wrap(wasmx.getAddress()));

    const blockEntry = new wblocks.BlockEntry(
        processReq.height,
        contractAddress,
        contractAddress,
        blockDataBase64,
        blockHeaderBase64,
        "", // TODO operator_address,
        commitBase64,
        stringToBase64(`{"evidence":[]}`),
        "",
        "",
    )
    const entry = new LogEntryAggregate(processReq.height, termId, leaderId, blockEntry);
    appendLogEntry(entry);
}
