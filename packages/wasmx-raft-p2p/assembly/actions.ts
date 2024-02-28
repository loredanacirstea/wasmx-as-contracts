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
import { callHookContract, checkValidatorsUpdate, getAllValidators, getConsensusParams, getCurrentValidator, getFinalBlock, getLastBlockIndex, getLastLog, getMajority, getRandomInRange, initChain, initializeIndexArrays, setConsensusParams, setFinalizedBlock, signMessage, updateConsensusParams, updateValidators, verifyMessage, verifyMessageByAddr } from "wasmx-raft/assembly/action_utils";
import { PROTOCOL_ID } from "./types";
import { checkCommits, prepareAppendEntry, prepareAppendEntryMessage, registeredCheckMessage, registeredCheckNeeded, voteInternal } from "wasmx-raft/assembly/actions";
import { extractIndexedTopics, getCommitHash, getConsensusParamsHash, getEvidenceHash, getHeaderHash, getResultsHash, getTxsHash, getValidatorsHash } from "wasmx-consensus-utils/assembly/utils"

export function connectPeers(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getCurrentState()
    const valid = getCurrentValidator()
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
        peers[i] = new NodeInfo(addr, new Node(p2pid, host, port, parts1[1]));
    }
    setNodeIPs(peers);
    initChain(data);
    initializeIndexArrays(peers.length);
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

    for (let i = 0; i < limit; i++) {
        const tx = txs[0];
        const msgstr = `{"run":{"event":{"type":"newTransaction","params":[{"key": "transaction","value":"${tx}"}]}}}`
        const peers = [getP2PAddress(nodeInfo)]
        LoggerDebug("forwarding tx to leader", ["nodeId", nodeId.toString(), "nodeIp", nodeInfo.node.ip, "tx_batch_index", i.toString()])
        p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(msgstr, PROTOCOL_ID, peers))
    }
}

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
    const msgstr = registeredCheckMessage(ips, nodeId);
    LoggerInfo("register request", ["req", msgstr])

    let peers: string[] = []
    for (let i = 0; i < ips.length; i++) {
        // don't send to ourselves or to removed nodes
        if (i == nodeId || ips[i].node.ip == "") continue;
        peers.push(getP2PAddress(ips[i]))
    }

    LoggerDebug("sending node registration", ["peers", peers.join(","), "data", msgstr])
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(msgstr, PROTOCOL_ID, peers))
}

export function registeredCheckResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    // TODO registeredCheckResponse

    // LoggerInfo("register response", ["error", response.error, "data", response.data])
    // if (response.error.length > 0 || response.data.length == 0) {
    //     return
    // }
    // const resp = JSON.parse<UpdateNodeResponse>(response.data);
    // if (resp.nodes[resp.nodeId].node.ip != nodeIp.node.ip) {
    //     LoggerError("register node response has wrong ip", ["expected", nodeIp.node.ip]);
    //     revert(`register node response has wrong ip`)
    // }
    // const allvalidStr = String.UTF8.decode(decodeBase64(resp.validators).buffer);
    // console.debug("* register node allvalidStr: " + allvalidStr)
    // const allvalidators = JSON.parse<typestnd.ValidatorInfo[]>(allvalidStr);
    // checkValidatorsUpdate(allvalidators, validatorInfo, resp.nodeId);
    // setCurrentNodeId(resp.nodeId);
    // setNodeIPs(resp.nodes);
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
    LoggerInfo("sending vote requests...", [])
    for (let i = 0; i < ips.length; i++) {
        // don't send to ourselves or to removed nodes
        if (candidateId === i || ips[i].node.ip.length == 0) continue;
        sendVoteRequest(i, ips[i], request, termId);
    }
}

function sendVoteRequest(nodeId: i32, node: NodeInfo, request: VoteRequest, termId: i32): void {
    const datastr = JSON.stringify<VoteRequest>(request);
    const signature = signMessage(datastr);

    // const msgstr = `{"run":{"event":{"type":"receiveVoteRequest","params":[{"key":"termId","value":"${request.termId.toString()}"},{"key":"candidateId","value":"${request.candidateId.toString()}"},{"key":"lastLogIndex","value":"${request.lastLogIndex.toString()}"},{"key":"lastLogTerm","value":"${request.lastLogTerm.toString()}"}]}}}`
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveVoteRequest","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`

    LoggerDebug("sending vote request", ["nodeId", nodeId.toString(), "nodeIp", node.node.ip, "termId", termId.toString(), "data", datastr])

    const peers = [getP2PAddress(node)]
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(msgstr, PROTOCOL_ID, peers))
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
        if (nodeId === i || ips[i].node.ip.length == 0) continue;
        sendAppendEntry(i, ips[i], ips);
        otherNodesCount += 1;
    }
    if (otherNodesCount == 0) {
        checkCommits();
    }
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
    let lastIndex = getLastLogIndex();
    const data = prepareAppendEntry(nodeIps, nextIndex, lastIndex);
    const msgstr = prepareAppendEntryMessage(nodeId, nextIndex, lastIndex, node, data);

    // we send the request to the same contract
    // const contract = wasmx.getAddress();
    const peers = [getP2PAddress(node)]
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(msgstr, PROTOCOL_ID, peers))
    // Uint8Array.wrap(contract)
}

export function receiveAppendEntryResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("data")) {
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
    const entry = ctx.get("data")
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
        nextIndexPerNode[nodeId] = resp.lastIndex;
        setNextIndexArray(nextIndexPerNode);
    }
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

    // receiveVoteResponse
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(msgstr, PROTOCOL_ID, peers))

}

function getP2PAddress(nodeInfo: NodeInfo): string {
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
