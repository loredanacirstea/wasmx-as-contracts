import { JSON } from "json-as";
import * as base64 from "as-base64/assembly"
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import { DEFAULT_GAS_TX } from "wasmx-env/assembly/const";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxevs from 'wasmx-env/assembly/events';
import * as hooks from 'wasmx-env/assembly/hooks';
import * as consutil from "wasmx-consensus/assembly/utils";
import * as wasmxcorew from 'wasmx-env-core/assembly/wasmxcore_wrap';
import { callContract } from "wasmx-env/assembly/utils";
import * as mctypes from "wasmx-consensus/assembly/types_multichain";
import { LoggerDebug, LoggerInfo, LoggerError, revert, LoggerDebugExtended } from "./utils";
import {
  Base64String,
  Bech32String,
  CallRequest,
  CallResponse,
  HexString,
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
import { parseInt32, parseInt64, base64ToHex, stringToBase64, base64ToString } from "wasmx-utils/assembly/utils";
import { LogEntry, LogEntryAggregate, TransactionResponse, AppendEntry, AppendEntryResponse, VoteResponse, VoteRequest, NodeUpdate, UpdateNodeResponse, MODULE_NAME } from "./types_raft";
import { BigInt } from "wasmx-env/assembly/bn";
import { appendLogEntry, getCommitIndex, getCurrentNodeId, getCurrentState, getLastLogIndex, getLogEntryObj, getMatchIndexArray, getMempool, getNextIndexArray, getNodeCount, getNodeIPs, getTermId, getVoteIndexArray, hasVotedFor, removeLogEntry, setCommitIndex, setCurrentNodeId, setCurrentState, setElectionTimeout, setLastApplied, setLastLogIndex, setMatchIndexArray, setMempool, setNextIndexArray, setNodeIPs, setTermId, setVoteIndexArray, setVotedFor } from "./storage";
import * as cfg from "./config";
import { callHookContract, callHookNonCContract, checkValidatorsUpdate, decodeTx, getAllValidators,getBlockID, getConsensusParams, getCurrentValidator, getFinalBlock, getLastBlockIndex, getLastLog, getMajority, getRandomInRange, getValidatorByHexAddr, initChain, initializeIndexArrays, isNodeValidator, parseNodeAddress, setFinalizedBlock, signMessage, updateConsensusParams, updateValidators, verifyMessage, verifyMessageByAddr } from "./action_utils";
import { extractIndexedTopics, getActiveValidatorInfo, getCommitHash, getConsensusParamsHash, getEvidenceHash, getHeaderHash, getResultsHash, getTxsHash, getValidatorsHash, sortTendermintValidators } from "wasmx-consensus-utils/assembly/utils"
import { NetworkNode, NodeInfo } from "wasmx-p2p/assembly/types";
import { getLeaderChain } from "wasmx-consensus/assembly/multichain_utils";

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
        const response = wasmxcorew.grpcRequest(ips[i].node.ip, Uint8Array.wrap(contract), msgBase64);
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
        revert(`signature verification failed: address ${entry.node.address} ; signature ${signature} ; msg ${entryStr}`);
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
    if (mempool.map.keys().length == 0) {
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

    let limit = mempool.map.keys().length;
    if (limit > 5) {
        limit = 5;
    }
    const txs = mempool.map.values().slice(0, limit);
    const txhs = mempool.map.keys().slice(0, limit);
    LoggerDebug("forwarding txs to leader", ["nodeId", nodeId.toString(), "nodeIp", nodeIp.node.ip, "count", limit.toString()])

    for (let i = 0; i < limit; i++) {
        const tx = txs[i];
        const msgstr = `{"run":{"event":{"type":"newTransaction","params":[{"key": "transaction","value":"${tx.tx}"}]}}}`
        const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));
        const response = wasmxcorew.grpcRequest(nodeIp.node.ip, Uint8Array.wrap(contract), msgBase64);
        LoggerDebug("forwarding tx to leader", ["nodeId", nodeId.toString(), "nodeIp", nodeIp.node.ip, "batch", i.toString(), "error", response.error])

        if (response.error.length == 0) {
            mempool.remove(txhs[i])
            continue;
        }
        // this may happen even if we check when we receive the tx
        if (response.error.includes(cfg.ERROR_INVALID_TX)) {
            mempool.remove(txhs[i])
            LoggerDebug("forwarded invalid transaction", ["tx", tx.tx]);
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
    const response = wasmxcorew.grpcRequest(node.node.ip, Uint8Array.wrap(contract), msgBase64);
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
    // TODO use parseNodeAddress format! - same as libp2p
    // <address>@/ip4/127.0.0.1/tcp/5001/grpc/ID

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
    const processReqWithMeta = JSON.parse<typestnd.RequestProcessProposalWithMetaInfo>(String.UTF8.decode(data.buffer));
    const processReq = processReqWithMeta.request

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
    const response = wasmxcorew.grpcRequest(node.node.ip, Uint8Array.wrap(contract), msgBase64);
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
        if (entry != null) {
            entries.push(entry);
        }
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
    const batch = mempool.batch(cparams.block.max_gas, maxbytes, getCurrentState().chain_id);
    LoggerDebug("batch transactions", ["count", batch.txs.length.toString()])

    // TODO
    // maxDataBytes := types.MaxDataBytes(maxBytes, evSize, state.Validators.Size())
    const maxDataBytes = maxbytes;

    // start proposal protocol
    startBlockProposal(batch.txs, batch.isAtomicTx, batch.cummulatedGas, maxDataBytes);
    setMempool(mempool);
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

export function addTransactionToMempool(
    transaction: string, // base64
): void {
    // check that tx is valid
    const txhash = wasmxw.sha256(transaction);
    const checktx = new typestnd.RequestCheckTx(transaction, typestnd.CheckTxType.New);
    const checkResp = consensuswrap.CheckTx(checktx);
    // we only check the code type; CheckTx should be stateless, just form checking
    if (checkResp.code !== typestnd.CodeType.Ok) {
        // transaction is not valid, we should finish; we use this error to check forwarded txs to leader
        return revert(`${cfg.ERROR_INVALID_TX}; code ${checkResp.code}; ${checkResp.log}`);
    }

    // add to mempool
    const mempool = getMempool();
    const parsedTx = decodeTx(transaction);
    let txGas: u64 = 1000000
    const fee = parsedTx.auth_info.fee
    if (fee != null) {
        txGas = fee.gas_limit
    }
    const cparams = getConsensusParams(0);
    const maxgas = cparams.block.max_gas;
    if (maxgas > -1 && u64(maxgas) < txGas) {
        return revert(`out of gas: ${txGas}; max ${maxgas}`);
    }

    // if atomic transaction, we calculate the leader chain id and index it by leader
    // we revert if extension leader is incorrect
    const extopts = parsedTx.body.extension_options
    let leader = ""
    for (let i = 0; i < extopts.length; i++) {
        const extany = extopts[i]
        if (extany.type_url == typestnd.TypeUrl_ExtensionOptionAtomicMultiChainTx) {
            const ext = typestnd.ExtensionOptionAtomicMultiChainTx.fromAnyWrap(extany)
            const ourchain = getCurrentState().chain_id;
            if (!ext.chain_ids.includes(ourchain)) {
                // this tx is not for our chain, we do not add to mempool
                // but we will continue, so it is forwarded to other nodes
                return;
            }
            leader = getLeaderChain(ext.chain_ids)
            if (leader != ext.leader_chain_id) {
                revert(`atomic transaction wrong leader: expected ${leader}, got ${ext.leader_chain_id}`)
            }
        }
    }

    mempool.add(txhash, transaction, txGas, leader);
    setMempool(mempool);
}

function startBlockProposal(txs: string[], optimisticExecution: boolean, cummulatedGas: i64, maxDataBytes: i64): void {
    // PrepareProposal TODO finish
    const height = getLastLogIndex() + 1;
    LoggerDebug("start block proposal", ["height", height.toString()])

    const currentState = getCurrentState();
    const validators = getAllValidators();

    // get only active validators & sort by power and address
    const validatorInfos = sortTendermintValidators(getActiveValidatorInfo(validators))
    const validatorSet = new typestnd.TendermintValidators(validatorInfos)

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
    LoggerInfo("start block proposal", ["height", height.toString(), "hash", hash, "optimistic_execution", optimisticExecution.toString()])
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
    let metainfo = new Map<string,Base64String>()
    if (optimisticExecution) {
        const oeresp = doOptimisticExecution(processReq, processResp);
        metainfo = oeresp.metainfo;
    }
    // We have a valid proposal to propagate to other nodes
    return appendLogInternalVerified(processReq, header, lastBlockCommit, optimisticExecution, metainfo, validatorSet);
}

function startBlockFinalizationLeader(index: i64): boolean {
    LoggerInfo("start block finalization", ["height", index.toString()])
    // get entry and apply it
    const entryobj = getLogEntryAggregate(index);
    if (entryobj == null) {
        LoggerInfo("cannot start block finalization", ["height", index.toString(), "reason", "block empty"])
        return false;
    }
    LoggerDebug("start block finalization", ["height", index.toString(), "leaderId", entryobj.leaderId.toString(), "termId", entryobj.termId.toString()])
    LoggerDebugExtended("start block finalization", ["height", index.toString(), "leaderId", entryobj.leaderId.toString(), "termId", entryobj.termId.toString(), "data", JSON.stringify<wblocks.BlockEntry>(entryobj.data)])

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
    if (entryobj == null) {
        LoggerInfo("cannot start block finalization", ["height", index.toString(), "reason", "block empty"])
        return false;
    }
    LoggerDebug("start block finalization", ["height", index.toString(), "leaderId", entryobj.leaderId.toString(), "termId", entryobj.termId.toString()])
    LoggerDebugExtended("start block finalization", ["height", index.toString(), "leaderId", entryobj.leaderId.toString(), "termId", entryobj.termId.toString(), "data", JSON.stringify<wblocks.BlockEntry>(entryobj.data)])
    return startBlockFinalizationInternal(entryobj, false);
}

function startBlockFinalizationInternal(entryobj: LogEntryAggregate, retry: boolean): boolean {
    const processReqStr = String.UTF8.decode(decodeBase64(entryobj.data.data).buffer);
    const processReqWithMeta = JSON.parse<typestnd.RequestProcessProposalWithMetaInfo>(processReqStr);
    const processReq = processReqWithMeta.request

    // some blocks are stored out of order, so we run the block verification again
    const errorStr = verifyBlockProposal(entryobj.data, processReq)
    if (errorStr.length > 0) {
        LoggerError("new block rejected", ["height", processReq.height.toString(), "error", errorStr, "header", entryobj.data.header])
        return false;
    }

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

    // if we have done optimisting execution, BeginBlock was already ran
    const oeran = processReqWithMeta.optimistic_execution && processReq.proposer_address == getSelfNodeInfo().address
    if (!oeran) {
        const resbegin = consensuswrap.BeginBlock(finalizeReq);
        if (resbegin.error.length > 0 && !retry) {
            // ERR invalid height: 3232; expected: 3233
            const mismatchErr = `expected: ${(finalizeReq.height + 1).toString()}`
            LoggerInfo(`begin block error`, ["error", resbegin.error])
            if (resbegin.error.includes("invalid height") && resbegin.error.includes(mismatchErr)) {
                const rollbackHeight = finalizeReq.height - 1;
                LoggerInfo(`trying to rollback`, ["height", rollbackHeight.toString()])
                const err = consensuswrap.RollbackToVersion(rollbackHeight);
                if (err.length > 0) {
                    revert(`consensus break: ${resbegin.error}; ${err}`);
                    return false;
                }
                // repeat FinalizeBlock
                return startBlockFinalizationInternal(entryobj, true);
            } else {
                revert(resbegin.error)
                return false;
            }
        }
    }

    let respWrap = consensuswrap.FinalizeBlock(new typestnd.WrapRequestFinalizeBlock(finalizeReq, processReqWithMeta.metainfo));
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
    let state = getCurrentState();
    state.app_hash = finalizeResp.app_hash;
    state.last_block_id = getBlockID(finalizeReq.hash)

    state.last_commit_hash = last_commit_hash
    state.last_results_hash = last_results_hash
    setCurrentState(state);
    // update consensus params
    LoggerDebug("updating consensus parameters...", [])
    const consensusUpd = finalizeResp.consensus_param_updates
    updateConsensusParams(finalizeReq.height, consensusUpd);

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
    // or if a new validator was added
    const info = consutil.defaultFinalizeResponseEventsParse(finalizeResp.tx_results)

     // EndBlock will execute passed governance proposals
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
        let req = new CallRequest(info.consensusContract, calldata, BigInt.zero(), DEFAULT_GAS_TX, false);
        let resp = wasmxw.call(req, MODULE_NAME);
        if (resp.success > 0) {
            LoggerError("cannot setup next consensus contract", ["new contract", info.consensusContract, "err", resp.data]);
        } else {
            LoggerInfo("next consensus contract is set", ["new contract", info.consensusContract])
            newContractSetup = true;

            // stop this contract and any intervals on this contract
            // TODO cancel all intervals on stop() action
            calldata = `{"run":{"event":{"type":"stop","params":[]}}}`
            req = new CallRequest(myaddress, calldata, BigInt.zero(), DEFAULT_GAS_TX, false);
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

    // make sure termId is synced
    setTermId(entryobj.termId)

    if (info.createdValidators.length > 0) {
        const ouraddr = getSelfNodeInfo().address
        for (let i = 0; i < info.createdValidators.length; i++) {
            if (info.createdValidators[i].operator_address == ouraddr) {
                LoggerInfo("node is validator", ["height", entryobj.index.toString(), "address", ouraddr])

                // call consensus contract with "becomeValidator" transition
                const calldatastr = `{"run":{"event": {"type": "becomeValidator", "params": []}}}`;
                callContract(wasmxw.getAddress(), calldatastr, false, MODULE_NAME);
            }
        }
    }

    // TODO if we cannot start with the new contract, maybe we should remove its consensus role
    // but we are already after Commit(), so restart is not really feasible with this mechanism
    // we may need another mechanism where nodes can trigger transactions

    // if consensus changed, start the new contract
    if (info.consensusContract != "" && newContractSetup) {
        LoggerInfo("starting new consensus contract", ["address", info.consensusContract])
        let calldata = `{"run":{"event":{"type":"prestart","params":[]}}}`
        let req = new CallRequest(info.consensusContract, calldata, BigInt.zero(), DEFAULT_GAS_TX, false);
        let resp = wasmxw.call(req, MODULE_NAME);
        if (resp.success > 0) {
            LoggerError("cannot start next consensus contract", ["new contract", info.consensusContract, "err", resp.data]);
            // we can restart the old contract here, so the chain does not stop
            const myaddress = wasmxw.addr_humanize(wasmx.getAddress());
            calldata = `{"run":{"event":{"type":"restart","params":[]}}}`
            req = new CallRequest(myaddress, calldata, BigInt.zero(), DEFAULT_GAS_TX, false);
            resp = wasmxw.call(req, MODULE_NAME);
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
    let req = new CallRequest(oldContract, calldata, BigInt.zero(), DEFAULT_GAS_TX, true);
    let resp = wasmxw.call(req, MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get nodeIPs from previous contract")
    }
    let data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up nodeIPs", ["ips", data])
    const nodeIps = JSON.parse<Array<NodeInfo>>(data)
    setNodeIPs(nodeIps);

    calldata = `{"getContextValue":{"key":"state"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), DEFAULT_GAS_TX, true);
    resp = wasmxw.call(req, MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get state from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up state", ["data", data])
    const state = JSON.parse<CurrentState>(data)
    setCurrentState(state);

    calldata = `{"getContextValue":{"key":"mempool"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), DEFAULT_GAS_TX, true);
    resp = wasmxw.call(req, MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get mempool from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up mempool", ["data", data])
    const mempool = JSON.parse<Mempool>(data)
    setMempool(mempool);

    calldata = `{"getContextValue":{"key":"currentNodeId"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), DEFAULT_GAS_TX, true);
    resp = wasmxw.call(req, MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get currentNodeId from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up currentNodeId", ["data", data])
    const currentNodeId = parseInt32(data);
    setCurrentNodeId(currentNodeId);

    calldata = `{"getContextValue":{"key":"currentTerm"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), DEFAULT_GAS_TX, true);
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

    // // TODO we run the hooks that must be ran after block end
    // const blockData = getFinalBlock(getLastBlockIndex())
    // callHookContract(hooks.HOOK_END_BLOCK, blockData);
}


function appendLogInternalVerified(processReq: typestnd.RequestProcessProposal, header: typestnd.Header, blockCommit: typestnd.BlockCommit, optimisticExecution: boolean, meta: Map<string,Base64String>, validatorSet: typestnd.TendermintValidators): void {
    const blockData = JSON.stringify<typestnd.RequestProcessProposalWithMetaInfo>(new typestnd.RequestProcessProposalWithMetaInfo(processReq, optimisticExecution, meta));
    const blockDataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(blockData)))
    const blockHeader = JSON.stringify<typestnd.Header>(header);
    const blockHeaderBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(blockHeader)))
    const commit = JSON.stringify<typestnd.BlockCommit>(blockCommit);
    const commitBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(commit)))
    const termId = getTermId();
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
        stringToBase64(JSON.stringify<typestnd.TendermintValidators>(validatorSet))
    )
    const entry = new LogEntryAggregate(processReq.height, termId, leaderId, blockEntry);
    appendLogEntry(entry);
}


// https://github.com/cometbft/cometbft/blob/f4a803f14a2f5bc5c17d75fcd1131b9249bba133/state/validation.go
export function verifyBlockProposal(data: wblocks.BlockEntry, processReq: typestnd.RequestProcessProposal): string {
    // TODO? verify:
    // processReq.next_validators_hash
    // processReq.proposed_last_commit

    const header = JSON.parse<typestnd.Header>(base64ToString(data.header));
    const hash = getHeaderHash(header);
    if (hash != processReq.hash) return `header hash mismatch: expected ${processReq.hash}, got ${hash}`

    const currentState = getCurrentState();

    const app_hash = base64ToHex(currentState.app_hash)
    if (header.app_hash != app_hash) return `header app_hash mismatch: expected ${app_hash}, got ${header.app_hash}`
    if (header.version.block != typestnd.BlockProtocol) return `header version.block mismatch: expected ${typestnd.BlockProtocol}, got ${header.version.block}`
    if (header.version.app != currentState.version.consensus.app) return `header version.app mismatch: expected ${currentState.version.consensus.app}, got ${header.version.app}`
    if (header.chain_id != currentState.chain_id) return `header chain_id mismatch: expected ${currentState.chain_id}, got ${header.chain_id}`
    // if (header.height != currentState.nextHeight) return `header height mismatch: expected ${currentState.nextHeight}, got ${header.height}`

    const last_results_hash = base64ToHex(currentState.last_results_hash)
    if (header.last_results_hash != last_results_hash) return `header last_results_hash mismatch: expected ${last_results_hash}, got ${header.last_results_hash}`

    if (header.last_block_id.hash != currentState.last_block_id.hash) return `header last_block_id.hash mismatch: expected ${currentState.last_block_id.hash}, got ${header.last_block_id.hash}`
    if (header.last_block_id.parts.hash != currentState.last_block_id.parts.hash) return `header last_block_id.parts.hash mismatch: expected ${currentState.last_block_id.parts.hash}, got ${header.last_block_id.parts.hash}`
    if (header.last_block_id.parts.total != currentState.last_block_id.parts.total) return `header last_block_id.parts.total mismatch: expected ${currentState.last_block_id.parts.total}, got ${header.last_block_id.parts.total}`

    const data_hash = base64ToHex(getTxsHash(processReq.txs))
    if (header.data_hash != data_hash) return `header data_hash mismatch: expected ${data_hash}, got ${header.data_hash}`

    const consensus_hash = base64ToHex(getConsensusParamsHash(getConsensusParams(0)))
    if (header.consensus_hash != consensus_hash) return `header consensus_hash mismatch: expected ${consensus_hash}, got ${header.consensus_hash}`

    // TODO see other time constraints that fit our protocol
    // if (Date.fromString(header.time).getTime() <= Date.fromString(currentState.last_time).getTime()) {
    //     return `header time mismatch: expected higher than ${currentState.last_time}, got ${header.time}`
    // }
    // TODO set an upper time bound

    // TODO
    // header.last_commit_hash
    // header.next_validators_hash
    // header.validators_hash
    // header.evidence_hash
    // TODO validate commit format
    return "";
}

export function doOptimisticExecution(processReq: typestnd.RequestProcessProposal, processResp: typestnd.ResponseProcessProposal): typestnd.ResponseOptimisticExecution {
    // run block start first
    // we run block end when we actually finalize the block
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
    const resbegin = consensuswrap.BeginBlock(finalizeReq);
    if (resbegin.error.length > 0) {
        revert(`${resbegin.error}`);
    }

    return consensuswrap.OptimisticExecution(processReq, processResp);
}

export function getSelfNodeInfo(): NodeInfo {
    // const nodeIps = getValidatorNodesInfo();
     const nodeIps = getNodeIPs();
    const ourId = getCurrentNodeId();
    if (nodeIps.length < (ourId + 1)) {
        revert(`index out of range: nodes count ${nodeIps.length}, our node id is ${ourId}`)
    }
    return nodeIps[ourId];
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
