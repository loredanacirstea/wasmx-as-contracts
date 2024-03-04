import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import * as wblocks from "wasmx-blocks/assembly/types";
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as p2pw from "wasmx-p2p/assembly/p2p_wrap";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import { LoggerDebug, LoggerInfo, LoggerError, revert } from "./utils";
import {
  Base64String,
  Bech32String,
  CallRequest,
  CallResponse,
} from 'wasmx-env/assembly/types';
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as staking from "wasmx-stake/assembly/types";
import { CurrentState, Mempool } from "wasmx-raft/assembly/types_blockchain";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { hexToUint8Array, parseInt32, parseInt64, uint8ArrayToHex, i64ToUint8ArrayBE, base64ToHex, hex64ToBase64 } from "wasmx-utils/assembly/utils";
import { LogEntry, LogEntryAggregate, TransactionResponse, AppendEntry, VoteResponse, VoteRequest, NodeUpdate, UpdateNodeResponse, NodeInfo, MODULE_NAME, Node, AppendEntryResponse } from "wasmx-raft/assembly/types_raft";
import { BigInt } from "wasmx-env/assembly/bn";
import { appendLogEntry, getCommitIndex, getCurrentNodeId, getCurrentState, getLastLogIndex, getLogEntryObj, getMatchIndexArray, getMempool, getNextIndexArray, getNodeCount, getNodeIPs, getTermId, getVoteIndexArray, hasVotedFor, removeLogEntry, setCommitIndex, setCurrentNodeId, setCurrentState, setElectionTimeout, setLastApplied, setLastLogIndex, setMatchIndexArray, setMempool, setNextIndexArray, setNodeIPs, setTermId, setVoteIndexArray, setVotedFor } from "wasmx-raft/assembly/storage";
import * as cfg from "wasmx-raft/assembly/config";
import { callHookContract, checkValidatorsUpdate, getAllValidators, getConsensusParams, getCurrentValidator, getFinalBlock, getLastBlockIndex, getLastLog, getMajority, getNodeByAddress, getRandomInRange, getRandomInRangeI32, getRandomInRangeI64, initChain, initializeIndexArrays, setConsensusParams, setFinalizedBlock, signMessage, updateConsensusParams, updateValidators, verifyMessage, verifyMessageByAddr } from "wasmx-raft/assembly/action_utils";
import { PROTOCOL_ID, StateSyncRequest, StateSyncResponse } from "./types";
import { checkCommits, extractAppendEntry, extractUpdateNodeEntryAndVerify, getLogEntryAggregate, isNodeActive, prepareAppendEntry, prepareAppendEntryMessage, prepareHeartbeatResponse, processAppendEntry, registeredCheckMessage, registeredCheckNeeded, updateNodeEntry, voteInternal } from "wasmx-raft/assembly/actions";
import { extractIndexedTopics, getCommitHash, getConsensusParamsHash, getEvidenceHash, getHeaderHash, getResultsHash, getTxsHash, getValidatorsHash } from "wasmx-consensus-utils/assembly/utils"

export function connectPeers(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getCurrentState()
    const index = getCurrentNodeId();
    const nodeInfos = getNodeIPs();
    const node = nodeInfos[index];

    const reqstart = new p2ptypes.StartNodeWithIdentityRequest(node.node.port, PROTOCOL_ID, state.validator_privkey);
    const resp = p2pw.StartNodeWithIdentity(reqstart);
    if (resp.error != "") {
        revert(`start node with identity: ${resp.error}`)
    }
    for (let i = 0; i < nodeInfos.length; i++) {
        if (i == index) {
            // don't connect with ourselves
            continue;
        }
        const p2paddr = getP2PAddress(nodeInfos[i])
        const req = new p2ptypes.ConnectPeerRequest(PROTOCOL_ID, p2paddr)
        LoggerDebug(`trying to connect to peer`, ["p2paddress", p2paddr, "address", nodeInfos[i].address]);
        p2pw.ConnectPeer(req);
    }
}

export function setupNode(
    params: ActionParam[],
    event: EventObject,
): void {
    let currentNodeId: string = "";
    let nodeIPs: string = "";
    let initChainSetup: string = "";
    for (let i = 0; i < event.params.length; i++) {
        if (event.params[i].key === cfg.CURRENT_NODE_ID) {
            currentNodeId = event.params[i].value;
            continue;
        }
        if (event.params[i].key === cfg.NODE_IPS) {
            nodeIPs = event.params[i].value;
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
    if (nodeIPs === "") {
        revert("no nodeIPs found");
    }
    if (initChainSetup === "") {
        revert("no initChainSetup found");
    }
    fsm.setContextValue(cfg.CURRENT_NODE_ID, currentNodeId);

    // !! nodeIps must be the same for all nodes

    // TODO ID@host:ip
    // 6efc12ab37fc0e096d8618872f6930df53972879@0.0.0.0:26757
    fsm.setContextValue(cfg.NODE_IPS, nodeIPs);

    setCommitIndex(cfg.LOG_START);
    setLastApplied(cfg.LOG_START);

    const datajson = String.UTF8.decode(decodeBase64(initChainSetup).buffer);
    // TODO remove validator private key from logs in initChainSetup
    LoggerDebug("setupNode", ["currentNodeId", currentNodeId, "nodeIPs", nodeIPs, "initChainSetup", datajson])
    const data = JSON.parse<typestnd.InitChainSetup>(datajson);
    // const ips = JSON.parse<string[]>(nodeIPs);

    const peers = new Array<NodeInfo>(data.peers.length);
    for (let i = 0; i < data.peers.length; i++) {
        const parts1 = data.peers[i].split("@");
        if (parts1.length != 2) {
            revert(`invalid node format; found: ${data.peers[i]}`)
        }
        // <address>@/ip4/127.0.0.1/tcp/5001/p2p/12D3KooWMWpac4Qp74N2SNkcYfbZf2AWHz7cjv69EM5kejbXwBZF
        const addr = parts1[0]
        const parts2 = parts1[1].split("/")
        if (parts2.length != 7) {
            revert(`invalid node format; found: ${data.peers[i]}`)
        }
        const host = parts2[2]
        const port = parts2[4]
        const p2pid = parts2[6]
        peers[i] = new NodeInfo(addr, new Node(p2pid, host, port, parts1[1]), false);
    }
    setNodeIPs(peers);
    initChain(data);
    initializeIndexArrays(peers.length);
}

// Leader node receives a node update from a node and sends
// the updated list of nodes to the requester & the state sync provider
export function updateNodeAndReturn(
    params: ActionParam[],
    event: EventObject,
): void {
    let entry = extractUpdateNodeEntryAndVerify(params, event);
    const response = updateNodeEntry(entry);
    if (response == null) {
        return;
    }
    // raft algo uses leader node as state sync node in updateNodeEntry
    // here, we use a random node that is in sync
    const nextIndexes = getNextIndexArray();
    const lastIndex = getLastLogIndex();
    const ourId = getCurrentNodeId();
    response.sync_node_id = getRandomSynced(nextIndexes, lastIndex, ourId);

    const updateMsgStr = JSON.stringify<UpdateNodeResponse>(response);
    const signature = signMessage(updateMsgStr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(updateMsgStr)));
    const nodeIps = getNodeIPs();
    const senderaddr = nodeIps[ourId].address;
    const msgstr = `{"run":{"event":{"type":"receiveUpdateNodeResponse","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"},{"key": "sender","value":"${senderaddr}"}]}}}`

    // send an appendEntry to the state sync provider, so the node has an updated list of nodes
    // in order to verify the message signature from the new node
    if (response.sync_node_id != ourId) {
        sendAppendEntry(response.sync_node_id, nodeIps[response.sync_node_id], nodeIps);
    }
    // send update message only to the requesting node
    // other nodes get an updated list each heartbeat
    const peers = [getP2PAddress(entry.node)]

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
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
    const nodeInfo = nodeIps[nodeId];

    let limit = mempool.txs.length;
    if (limit > 5) {
        limit = 5;
    }
    const txs = mempool.txs.slice(0, limit);
    LoggerDebug("forwarding txs to leader", ["nodeId", nodeId.toString(), "nodeIp", nodeInfo.node.ip, "count", limit.toString()])
    const contract = wasmxw.getAddress();

    for (let i = 0; i < limit; i++) {
        const tx = txs[0];
        const msgstr = `{"run":{"event":{"type":"newTransaction","params":[{"key": "transaction","value":"${tx}"}]}}}`
        const peers = [getP2PAddress(nodeInfo)]
        LoggerDebug("forwarding tx to leader", ["nodeId", nodeId.toString(), "nodeIp", nodeInfo.node.ip, "tx_batch_index", i.toString()])
        p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
    }
    // TODO we will remove the tx from mempool now
    // if it is an invalid transaction (it can happen), then the leader will
    // reject it, so this node will continue to send it to the Leader
    // we should remove it only if found invalid
    mempool.txs.splice(0, limit);
    setMempool(mempool);
}

// this is executed each time the node is started in Follower or Candidate state if needed
// and the first time the node is started
export function requestNetworkSync(
    params: ActionParam[],
    event: EventObject,
): void {
    // we check that we are registered with the Leader
    // and that we are in sync
    registeredCheck(params, event);
}

// we just send a NodeUpdateRequest
// the node will receive a UpdateNodeResponse from the leader and then proceed to do state sync
export function registeredCheck(
    params: ActionParam[],
    event: EventObject,
): void {
    // when a node starts, it needs to add itself to the Leader's node list
    // we just need [ourIP, leaderIP]

    const ips = getNodeIPs();

    // if we are alone, return
    if (ips.length == 1) {
        return;
    }

    const nodeId = getCurrentNodeId();
    const msgstr = registeredCheckMessage(ips, nodeId);
    LoggerInfo("register request", ["req", msgstr])

    let peers: string[] = []
    for (let i = 0; i < ips.length; i++) {
        // don't send to ourselves or to removed nodes
        if (i == nodeId || ips[i].node.ip == "") continue;
        peers.push(getP2PAddress(ips[i]))
    }

    LoggerDebug("sending node registration", ["peers", peers.join(","), "data", msgstr])
    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
}

// received an updated node list from Leader
export function receiveUpdateNodeResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no data found");
    }
    if (!ctx.has("signature")) {
        revert("no signature found");
    }
    if (!ctx.has("sender")) { // node/validator address
        revert("no sender found");
    }
    const signature = ctx.get("signature")
    const sender = ctx.get("sender")
    const entry = ctx.get("entry")
    const data = String.UTF8.decode(decodeBase64(entry).buffer);
    const resp = JSON.parse<UpdateNodeResponse>(data)
    LoggerInfo("nodes list update", ["data", data])

    // verify signature
    const isSender = verifyMessageByAddr(sender, signature, data);
    if (!isSender) {
        LoggerError("signature verification failed for nodes list update", ["sender", sender]);
        return;
    }

    const nodeIps = getNodeIPs();
    const nodeId = getCurrentNodeId();
    const nodeInfo = nodeIps[nodeId];

    // we find our id
    let ourId = -1;
    for (let j = 0; j < resp.nodes.length; j++) {
        if (resp.nodes[j].address == nodeInfo.address) {
            ourId = j;
            break;
        }
    }
    if (ourId == -1) {
        LoggerError("node list does not contain our node", [])
        return;
    }
    const node = resp.nodes[ourId];
    if (node.node.host != nodeInfo.node.host) {
        LoggerError("node list contains wrong host data", ["address", nodeInfo.address, "id", ourId.toString(), "actual", node.node.host, "expected", nodeInfo.node.host])
        return;
        // revert(`node list node address mismatch`)
    }
    if (node.node.id != nodeInfo.node.id) {
        LoggerError("node list contains wrong id data", ["address", nodeInfo.address, "id", ourId.toString(), "actual", node.node.id, "expected", nodeInfo.node.id])
        return;
    }
    if (node.node.ip != nodeInfo.node.ip) {
        LoggerError("node list contains wrong ip data", ["address", nodeInfo.address, "id", ourId.toString(), "actual", node.node.ip, "expected", nodeInfo.node.ip])
        return;
    }
    if (node.node.port != nodeInfo.node.port) {
        LoggerError("node list contains wrong port data", ["address", nodeInfo.address, "id", ourId.toString(), "actual", node.node.port, "expected", nodeInfo.node.port])
        return;
    }
    setNodeIPs(resp.nodes);
    setCurrentNodeId(ourId);

    // state sync from the node provided by the leader, who is known to be synced
    sendStateSyncRequest(resp.sync_node_id);
}

// this is executed each time the node is started in Follower or Candidate state if needed
// and is also called after node registration with the leader
export function sendStateSyncRequest(nodeId: i32): void {
    const lastIndex = getLastLogIndex();
    const ourNodeId = getCurrentNodeId()
    const nodes = getNodeIPs();
    const receiverNode = nodes[nodeId]
    const request = new StateSyncRequest(lastIndex + 1);
    const datastr = JSON.stringify<StateSyncRequest>(request);
    const signature = signMessage(datastr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const senderaddr = nodes[ourNodeId].address
    const msgstr = `{"run":{"event":{"type":"receiveStateSyncRequest","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"},{"key": "sender","value":"${senderaddr}"}]}}}`

    LoggerDebug("sending statesync request", ["nodeId", nodeId.toString(), "address", receiverNode.address, "data", datastr])

    const peers = [getP2PAddress(receiverNode)]
    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
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
        LoggerInfo("sending vote requests...", [])
    }
    for (let i = 0; i < ips.length; i++) {
        // don't send to ourselves or to removed nodes
        if (candidateId === i || !isNodeActive(ips[i])) continue;
        sendVoteRequest(i, ips[i], request, termId);
    }
}

function sendVoteRequest(nodeId: i32, node: NodeInfo, request: VoteRequest, termId: i32): void {
    const datastr = JSON.stringify<VoteRequest>(request);
    const signature = signMessage(datastr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveVoteRequest","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`

    LoggerDebug("sending vote request", ["nodeId", nodeId.toString(), "nodeIp", node.node.ip, "termId", termId.toString(), "data", datastr])

    const peers = [getP2PAddress(node)]
    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
}

export function receiveVoteResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no data found");
    }
    if (!ctx.has("signature")) {
        revert("no signature found");
    }
    if (!ctx.has("sender")) { // node/validator address
        revert("no sender found");
    }
    const signature = ctx.get("signature")
    const sender = ctx.get("sender")
    const entry = ctx.get("entry")
    const data = String.UTF8.decode(decodeBase64(entry).buffer);
    const resp = JSON.parse<VoteResponse>(data)
    LoggerDebug("received vote response", ["sender", sender, "data", data])

    // verify signature
    const isSender = verifyMessageByAddr(sender, signature, data);
    if (!isSender) {
        LoggerError("signature verification failed for receiveVoteResponse", ["sender", sender]);
        return;
    }
    const nodeId = getNodeId(sender);
    const termId = getTermId();

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

export function sendAppendEntries(
    params: ActionParam[],
    event: EventObject,
): void {
    // go through each node
    const nodeId = getCurrentNodeId();
    const ips = getNodeIPs();
    LoggerDebug("diseminate entries...", ["nodeId", nodeId.toString(), "ips", JSON.stringify<Array<NodeInfo>>(ips)])
    let otherNodesCount = 0;
    for (let i = 0; i < ips.length; i++) {
        // don't send to Leader or removed nodes
        if (nodeId === i || !isNodeActive(ips[i])) continue;
        sendAppendEntry(i, ips[i], ips);
        otherNodesCount += 1;
    }
    if (otherNodesCount == 0) {
        checkCommits();
    }
}

// we eliminate out of sync nodes, until they get back online
export function sendAppendEntry(
    nodeId: i32,
    node: NodeInfo,
    nodeIps: NodeInfo[],
): void {
    const nextIndexPerNode = getNextIndexArray();
    const nextIndex = nextIndexPerNode.at(nodeId);
    let lastIndex = getLastLogIndex();

    if ((lastIndex - nextIndex) > cfg.STATE_SYNC_BATCH) {
        // this node is out of sync
        nodeIps[nodeId].outofsync = true;
        setNodeIPs(nodeIps)
        return;
    }

    const data = prepareAppendEntry(nodeIps, nextIndex, lastIndex);
    const msgstr = prepareAppendEntryMessage(nodeId, nextIndex, lastIndex, lastIndex, node, data);

    LoggerDebug("diseminate entry", ["count", data.entries.length.toString(), "address", node.address])

    // we send the request to the same contract
    // const contract = wasmx.getAddress();
    const peers = [getP2PAddress(node)]
    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
    // Uint8Array.wrap(contract)
}

// received by the Leader node from the other nodes that have received and
// applied the new entries
export function receiveAppendEntryResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no data found");
    }
    if (!ctx.has("signature")) {
        revert("no signature found");
    }
    if (!ctx.has("sender")) { // node/validator address
        revert("no sender found");
    }
    const signature = ctx.get("signature")
    const sender = ctx.get("sender")
    const entry = ctx.get("entry")
    const data = String.UTF8.decode(decodeBase64(entry).buffer);
    const resp = JSON.parse<AppendEntryResponse>(data)
    LoggerDebug("received append entry response", ["sender", sender, "data", data])

    // verify signature
    const isSender = verifyMessageByAddr(sender, signature, data);
    if (!isSender) {
        LoggerError("signature verification failed for receiveAppendEntryResponse", ["sender", sender]);
        return;
    }
    const nodeId = getNodeId(sender);

    // TODO something with resp.term
    // const termId = getTermId();
    if (resp.success) {
        const nextIndexPerNode = getNextIndexArray();
        // const nextIndex = nextIndexPerNode.at(nodeId);
        nextIndexPerNode[nodeId] = resp.lastIndex + 1;
        setNextIndexArray(nextIndexPerNode);
        const nodes = getNodeIPs();
        if (nodes[nodeId].outofsync) {
            nodes[nodeId].outofsync = false;
            setNodeIPs(nodes);
        }
    }
}

export function receiveStateSyncResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    // TODO maybe restrict this only if the node is syncing and only from the
    // expected node
    // add to currentState:
    // syncing: bool, syncnode: i32 (node id)
    // sending StateSyncRequest -> set syncing bool & syncnode
    // receive response -> update -> resync until we are synced

    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no data found");
    }
    if (!ctx.has("sender")) { // node/validator address
        revert("no sender found");
    }
    const entry = ctx.get("entry")
    const data = String.UTF8.decode(decodeBase64(entry).buffer);
    const resp = JSON.parse<StateSyncResponse>(data)

    LoggerInfo("received statesync response", ["count", resp.entries.length.toString(), "from", resp.start_batch_index.toString(), "to", resp.last_batch_index.toString(), "last_log_index", resp.last_log_index.toString()])

    setTermId(resp.termId);
    // now we check the new block
    for (let i = 0; i < resp.entries.length; i++) {
        processAppendEntry(resp.entries[i]);
    }

    // if we are synced, we announce the Leader node
    if (resp.last_batch_index >= resp.last_log_index) {
        // send receiveAppendEntryResponse to Leader node
        const lastLog = getLastLog();
        const response = new AppendEntryResponse(resp.termId, true, resp.last_batch_index);
        LoggerInfo("send heartbeat response", ["termId", resp.termId.toString(), "success", "true", "lastLogIndex", resp.last_batch_index.toString(), "leaderId", lastLog.leaderId.toString()])
        sendHeartbeatResponseMessage(response, lastLog.leaderId);
    }
}

// received statesync request
export function receiveStateSyncRequest(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no data found");
    }
    if (!ctx.has("signature")) {
        revert("no signature found");
    }
    if (!ctx.has("sender")) { // node/validator address
        revert("no sender found");
    }
    const signature = ctx.get("signature")
    const sender = ctx.get("sender")
    const entry = ctx.get("entry")
    const data = String.UTF8.decode(decodeBase64(entry).buffer);
    const resp = JSON.parse<StateSyncRequest>(data)
    LoggerInfo("statesync request", ["data", data, "sender", sender])

    // verify signature
    const isSender = verifyMessageByAddr(sender, signature, data);
    if (!isSender) {
        LoggerError("signature verification failed for nodes list update", ["sender", sender]);
        return;
    }

    // we send statesync response with the first batch
    const termId = getTermId()
    const lastIndex = getLastLogIndex()

    // send successive messages with max STATE_SYNC_BATCH blocks at a time
    const count = lastIndex - resp.start_index
    if (count == 0) return;

    const batches = i32(Math.ceil(f64(count)/f64(cfg.STATE_SYNC_BATCH)))
    let startIndex = resp.start_index;
    let lastIndexToSend = startIndex;
    for (let i = 0; i < batches - 1; i++) {
        lastIndexToSend = startIndex + cfg.STATE_SYNC_BATCH
        sendStateSyncBatch(startIndex, lastIndexToSend, lastIndex, termId, sender);
        startIndex += cfg.STATE_SYNC_BATCH
    }
    if (lastIndexToSend < lastIndex) {
        // last batch
        sendStateSyncBatch(startIndex, lastIndex, lastIndex, termId, sender);
    }
    LoggerInfo("state sync messages finished", ["lastIndex", lastIndex.toString()])
}

function sendStateSyncBatch(start_index: i64, lastIndexToSend: i64, lastIndex: i64, termId: i32, receiver: Bech32String): void {
    const entries: Array<LogEntryAggregate> = [];
    for (let i = start_index; i <= lastIndexToSend; i++) {
        const entry = getLogEntryAggregate(i);
        entries.push(entry);
    }

    // we do not sign this message, because the receiver does not have our publicKey

    const response = new StateSyncResponse(start_index, lastIndexToSend, lastIndex, termId, entries);
    const datastr = JSON.stringify<StateSyncResponse>(response);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const nodes = getNodeIPs();
    const ourId = getCurrentNodeId();
    const senderaddr = nodes[ourId].address;
    const msgstr = `{"run":{"event":{"type":"receiveStateSyncResponse","params":[{"key": "entry","value":"${dataBase64}"},{"key": "sender","value":"${senderaddr}"}]}}}`
    LoggerDebug("sending state sync chunk", ["to", receiver, "count", response.entries.length.toString(), "from", start_index.toString(), "to", lastIndexToSend.toString(), "last_index", lastIndex.toString()])

    const nodeInfo = getNodeByAddress(receiver, nodes)
    if (nodeInfo == null) {
        return revert(`cannot find node by address: ${receiver}`)
    }
    const peers = [getP2PAddress(nodeInfo)]
    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
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

    // send response
    const nodeId = entry.candidateId;
    const nodeIps = getNodeIPs();
    const ourId = getCurrentNodeId();
    const nodeInfo = nodeIps[nodeId];
    const peers = [getP2PAddress(nodeInfo)]

    const datastr = JSON.stringify<VoteResponse>(response);
    const signatureResp = signMessage(datastr);

    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const senderaddr = nodeIps[ourId].address;
    const msgstr = `{"run":{"event":{"type":"receiveVoteResponse","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signatureResp}"},{"key": "sender","value":"${senderaddr}"}]}}}`

    LoggerDebug("sending vote response", ["to", entry.candidateId.toString(), "data", datastr])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))

}

// send to leader node
export function sendHeartbeatResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const entry = extractAppendEntry(params, event)
    const response = prepareHeartbeatResponse(entry)
    sendHeartbeatResponseMessage(response, entry.leaderId);
}

export function sendHeartbeatResponseMessage(response: AppendEntryResponse, leaderId: i32): void {
    const datastr = JSON.stringify<AppendEntryResponse>(response);
    const signatureResp = signMessage(datastr);
    const nodeIps = getNodeIPs();
    const ourId = getCurrentNodeId();
    const peers = [getP2PAddress(nodeIps[leaderId])]

    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const senderaddr = nodeIps[ourId].address;
    const msgstr = `{"run":{"event":{"type":"receiveAppendEntryResponse","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signatureResp}"},{"key": "sender","value":"${senderaddr}"}]}}}`

    LoggerDebug("sending new entries response to leader", ["leaderId", leaderId.toString(), "lastIndex", response.lastIndex.toString()])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
}

export function getP2PAddress(nodeInfo: NodeInfo): string {
    return `/ip4/${nodeInfo.node.host}/tcp/${nodeInfo.node.port}/ipfs/${nodeInfo.node.id}`
}

function getNodeId(addr: Bech32String): i32 {
    const nodeInfos = getNodeIPs()
    for (let i = 0; i < nodeInfos.length; i++) {
        if (nodeInfos[i].address == addr) {
            return i;
        }
    }
    return -1;
}

export function getRandomSynced(arr: i64[], lastIndex: i64, leaderId: i32): i32 {
    if (arr.length < 3) return leaderId;
    const synced: i32[] = []
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] >= lastIndex && arr[i] != leaderId) {
            synced.push(i);
        }
    }
    const indx = getRandomInRangeI32(0, synced.length-1)
    return synced[indx];
}
