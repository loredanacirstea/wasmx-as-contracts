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
import * as fsm from 'xstate-fsm-as/assembly/storage';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { hexToUint8Array, parseInt32, parseInt64, uint8ArrayToHex, i64ToUint8ArrayBE, base64ToHex, hex64ToBase64 } from "wasmx-utils/assembly/utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { PROTOCOL_ID, StateSyncRequest, StateSyncResponse } from "./types";
import { extractIndexedTopics, getCommitHash, getConsensusParamsHash, getEvidenceHash, getHeaderHash, getResultsHash, getTxsHash, getValidatorsHash } from "wasmx-consensus-utils/assembly/utils"
import { getCurrentNodeId, getCurrentState, getCurrentValidator, getLastLog, getNextIndexArray, getNodeIPs, setNodeIPs, setTermId } from "wasmx-tendermint/assembly/action_utils";
import { connectPeersInternal, getP2PAddress, receiveUpdateNodeResponseInternal, registeredCheck } from "wasmx-raft-p2p/assembly/actions"
import * as cfg from "wasmx-tendermint/assembly/config";
import { AppendEntry, AppendEntryResponse, LogEntryAggregate, Precommit } from "wasmx-tendermint/assembly/types";
import { extractAppendEntry, getLogEntryAggregate, initChain, initializeIndexArrays, isNodeActive, prepareAppendEntry, prepareAppendEntryMessage, processAppendEntry, readyToCommit, sendProposalResponseMessage, signMessage, startBlockFinalizationFollower, startBlockFinalizationFollowerInternal, startBlockFinalizationLeader, updateNodeEntry } from "wasmx-tendermint/assembly/actions";
import { extractUpdateNodeEntryAndVerify } from "wasmx-raft/assembly/actions";
import { getLastLogIndex, getTermId } from "wasmx-raft/assembly/storage";
import { getNodeByAddress, verifyMessageByAddr } from "wasmx-raft/assembly/action_utils";
import { Node, NodeInfo, UpdateNodeResponse } from "wasmx-raft/assembly/types_raft"

export function connectPeers(
    params: ActionParam[],
    event: EventObject,
): void {
    connectPeersInternal(PROTOCOL_ID);
}

export function requestNetworkSync(
    params: ActionParam[],
    event: EventObject,
): void {
    // we check that we are registered with the Leader
    // and that we are in sync
    registeredCheck(PROTOCOL_ID);
}

export function receiveUpdateNodeResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    receiveUpdateNodeResponseInternal(params, event, PROTOCOL_ID)
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

export function updateNodeAndReturn(
    params: ActionParam[],
    event: EventObject,
): void {
    let entry = extractUpdateNodeEntryAndVerify(params, event);
    const response = updateNodeEntry(entry);
    if (response == null) {
        return;
    }
    const ourId = getCurrentNodeId();
    response.sync_node_id = ourId

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

export function forwardTx(
    params: ActionParam[],
    event: EventObject,
): void {
    // TODO forward tx to other nodes too
    // let transaction: string = "";
    // for (let i = 0; i < event.params.length; i++) {
    //     if (event.params[i].key === "transaction") {
    //         transaction = event.params[i].value;
    //         continue;
    //     }
    // }
    // if (transaction === "") {
    //     revert("no transaction found");
    // }
}

// this actually commits one block at a time
export function commitBlocks(
    params: ActionParam[],
    event: EventObject,
): void {
    checkCommits();
}

// this gets called each reentry in Leader.active state
function checkCommits(): void {
    const nextCommit = readyToCommit()
    // TODO If AppendEntries fails because of log inconsistency: decrement nextIndex and retry
    if (nextCommit > 0) {

        sendPrecommits([], new EventObject("", []));

        // TODO commit only if entry.term == currentTerm:

        // We commit the state
        const consensusChanged = startBlockFinalizationLeader(nextCommit);
        if(consensusChanged) {
            // we need to also propagate the commit of this entry to the rest of the nodes
            // so they can enter the new consensus
            // TODO ?
            // sendAppendEntries([], new EventObject("", []))
        }
    }
}

export function sendPrecommits(
    params: ActionParam[],
    event: EventObject,
): void {
    // go through each node
    const nodeId = getCurrentNodeId();
    const ips = getNodeIPs();
    LoggerDebug("sending precommits...", ["nodeId", nodeId.toString(), "ips", JSON.stringify<Array<NodeInfo>>(ips)])
    for (let i = 0; i < ips.length; i++) {
        // don't send to Leader or removed nodes
        if (nodeId === i || !isNodeActive(ips[i])) continue;
        sendPrecommit(i, ips[i]);
    }
}

export function sendPrecommit(
    nodeId: i32,
    node: NodeInfo,
): void {
    const termId = getTermId();
    const lastIndex = getLastLogIndex();
    const proposerId = getCurrentNodeId()
    const entry: Precommit = new Precommit(termId, proposerId, lastIndex)
    const datastr = JSON.stringify<Precommit>(entry);
    const signature = signMessage(datastr);

    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receivePrecommit","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`

    LoggerDebug("sending precommit...", ["nodeId", nodeId.toString(), "receiver", node.address, "index", lastIndex.toString()])

    const peers = [getP2PAddress(node)]
    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
}

export function sendAppendEntries(
    params: ActionParam[],
    event: EventObject,
): void {
    // go through each node
    const nodeId = getCurrentNodeId();
    const ips = getNodeIPs();
    LoggerDebug("diseminate blocks...", ["nodeId", nodeId.toString(), "ips", JSON.stringify<Array<NodeInfo>>(ips)])
    for (let i = 0; i < ips.length; i++) {
        // don't send to Leader or removed nodes
        if (nodeId === i || !isNodeActive(ips[i])) continue;
        sendAppendEntry(i, ips[i], ips);
    }
}

export function sendAppendEntry(
    nodeId: i32,
    node: NodeInfo,
    nodeIps: NodeInfo[],
): void {
    const nextIndexPerNode = getNextIndexArray();
    const nextIndex = nextIndexPerNode.at(nodeId);
    let lastIndex = getLastLogIndex();
    let lastIndexToSend = lastIndex

    // TODO state sync & snapshotting
    // right now, don't send more than STATE_SYNC_BATCH blocks at a time
    if ((lastIndex - nextIndex) > cfg.STATE_SYNC_BATCH) {
        lastIndexToSend = nextIndex + cfg.STATE_SYNC_BATCH;
    }

    const data = prepareAppendEntry(nodeIps, nextIndex, lastIndexToSend);
    const msgstr = prepareAppendEntryMessage(nodeId, nextIndex, lastIndex, lastIndexToSend,node, data);

    const peers = [getP2PAddress(node)]
    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
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
        startBlockFinalizationFollowerInternal(resp.entries[i]);
    }

    // we dont need this
    // // if we are synced, we announce the Leader node
    // if (resp.last_batch_index >= resp.last_log_index) {
    //     // send receiveAppendEntryResponse to Leader node
    //     const lastLog = getLastLog();
    //     const response = new AppendEntryResponse(resp.termId, true, resp.last_batch_index);
    //     LoggerInfo("sending new entries response", ["termId", resp.termId.toString(), "success", "true", "lastLogIndex", resp.last_batch_index.toString(), "proposerId", lastLog.leaderId.toString()])
    //     sendAppendEntryResponseMessage(response, lastLog.leaderId);
    // }
}

export function sendAppendEntryResponseMessage(response: AppendEntryResponse, leaderId: i32): void {
    const datastr = JSON.stringify<AppendEntryResponse>(response);
    const signatureResp = signMessage(datastr);
    const nodeIps = getNodeIPs();
    const ourId = getCurrentNodeId();
    const peers = [getP2PAddress(nodeIps[leaderId])]

    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const senderaddr = nodeIps[ourId].address;
    const msgstr = `{"run":{"event":{"type":"receiveAppendEntryResponse","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signatureResp}"},{"key": "sender","value":"${senderaddr}"}]}}}`

    LoggerDebug("sending new entries response to proposer", ["proposerId", leaderId.toString(), "lastIndex", response.lastIndex.toString()])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
}

export function sendProposalResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const entry = extractAppendEntry(params, event)
    const response = sendProposalResponseMessage(entry)
    sendAppendEntryResponseMessage(response, entry.proposerId);
}
