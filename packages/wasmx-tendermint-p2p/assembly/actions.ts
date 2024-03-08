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
import { StateSyncRequest, StateSyncResponse } from "./sync_types";
import { PROTOCOL_ID } from "./config";
import { extractIndexedTopics, getCommitHash, getConsensusParamsHash, getEvidenceHash, getHeaderHash, getResultsHash, getTxsHash, getValidatorsHash } from "wasmx-consensus-utils/assembly/utils"
import { getCurrentNodeId, getCurrentState, getCurrentValidator, getLastLog, getPrevoteArray, setPrevoteArray, getPrecommitArray, setPrecommitArray, getValidatorNodesInfo, setValidatorNodesInfo, setTermId, setCurrentProposer, getCurrentProposer, appendLogEntry, setLogEntryAggregate, setCurrentState, setLastLogIndex } from "./storage";
import { getP2PAddress } from "wasmx-raft-p2p/assembly/actions"
import { callHookContract, setMempool, signMessage, updateNodeEntry } from "wasmx-tendermint/assembly/actions"
import { Mempool } from "wasmx-tendermint/assembly/types_blockchain";
import * as cfg from "./config";
import { AppendEntry, AppendEntryResponse, LogEntryAggregate } from "./types";
import { calculateCurrentProposer, extractAppendEntry, getLogEntryAggregate, initChain, initializeVoteArrays, isNodeActive, prepareAppendEntry, prepareAppendEntryMessage, readyToPrecommit, readyToPrevote, startBlockFinalizationFollower, startBlockFinalizationFollowerInternal } from "./action_utils";
import { extractUpdateNodeEntryAndVerify, registeredCheckMessage } from "wasmx-raft/assembly/actions";
import { getLastLogIndex, getTermId, setCurrentNodeId } from "wasmx-raft/assembly/storage";
import { getAllValidators, getFinalBlock, getNodeByAddress, getNodeIdByAddress, verifyMessage, verifyMessageByAddr } from "wasmx-raft/assembly/action_utils";
import { Node, NodeInfo, UpdateNodeResponse } from "wasmx-raft/assembly/types_raft"
import { getLastBlockIndex } from "wasmx-blocks/assembly/storage";
import { CurrentState, Precommit, Prevote } from "./types_blockchain";

export function connectRooms(
    params: ActionParam[],
    event: EventObject,
): void {
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_BLOCK_PROPOSAL))
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_MEMPOOL))
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_NODEINFO))
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_PRECOMMIT))
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_PREVOTE))
}

export function connectPeers(
    params: ActionParam[],
    event: EventObject,
): void {
    connectPeersInternal(PROTOCOL_ID);
}

export function connectPeersInternal(protocolId: string): void {
    const state = getCurrentState()
    const index = getCurrentNodeId();
    const nodeInfos = getValidatorNodesInfo();
    const node = nodeInfos[index];

    const reqstart = new p2ptypes.StartNodeWithIdentityRequest(node.node.port, protocolId, state.validator_privkey);
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
        const req = new p2ptypes.ConnectPeerRequest(protocolId, p2paddr)
        LoggerDebug(`trying to connect to peer`, ["p2paddress", p2paddr, "address", nodeInfos[i].address]);
        p2pw.ConnectPeer(req);
    }
}

export function requestNetworkSync(
    params: ActionParam[],
    event: EventObject,
): void {
    // we check that we are registered with the Leader
    // and that we are in sync
    registeredCheck(PROTOCOL_ID);
}

// we just send a NodeUpdateRequest
// the node will receive a UpdateNodeResponse from the leader and then proceed to do state sync
export function registeredCheck(protocolId: string): void {
    // when a node starts, it needs to add itself to the Leader's node list
    // we just need [ourIP, leaderIP]

    const ips = getValidatorNodesInfo();

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
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, protocolId, peers))
}

export function receiveUpdateNodeResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    console.log("--receiveUpdateNodeResponse--")
    receiveUpdateNodeResponseInternal(params, event, PROTOCOL_ID)
}

export function receiveUpdateNodeResponseInternal(
    params: ActionParam[],
    event: EventObject,
    protocolId: string,
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

    const nodeIps = getValidatorNodesInfo();
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
    setValidatorNodesInfo(resp.nodes);
    setCurrentNodeId(ourId);

    // state sync from the node provided by the leader, who is known to be synced
    sendStateSyncRequest(protocolId, resp.sync_node_id);
}

// this is executed each time the node is started in Follower or Candidate state if needed
// and is also called after node registration with the leader
export function sendStateSyncRequest(protocolId: string, nodeId: i32): void {
    const lastIndex = getLastLogIndex();
    const ourNodeId = getCurrentNodeId()
    const nodes = getValidatorNodesInfo();
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
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, protocolId, peers))
}

export function setupNode(
    params: ActionParam[],
    event: EventObject,
): void {
    let currentNodeId: string = "";
    let initChainSetup: string = "";
    for (let i = 0; i < event.params.length; i++) {
        if (event.params[i].key === cfg.CURRENT_NODE_ID) {
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
    fsm.setContextValue(cfg.CURRENT_NODE_ID, currentNodeId);

    // TODO ID@host:ip
    // 6efc12ab37fc0e096d8618872f6930df53972879@0.0.0.0:26757

    const datajson = String.UTF8.decode(decodeBase64(initChainSetup).buffer);
    // TODO remove validator private key from logs in initChainSetup
    LoggerDebug("setupNode", ["currentNodeId", currentNodeId, "initChainSetup", datajson])
    const data = JSON.parse<typestnd.InitChainSetup>(datajson);

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
    setValidatorNodesInfo(peers);
    initChain(data);
    initializeVoteArrays(peers.length);
}

export function setup(
    params: ActionParam[],
    event: EventObject,
): void {
    LoggerInfo("setting up new tendermint consensus contract", [])
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

    let calldata = `{"getContextValue":{"key":"${cfg.VALIDATOR_NODES_INFO}"}}`
    let req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    let resp = wasmxw.call(req, cfg.MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get nodeIPs from previous contract")
    }
    let data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up nodeIPs", ["ips", data])
    const nodeIps = JSON.parse<Array<NodeInfo>>(data)
    setValidatorNodesInfo(nodeIps);

    calldata = `{"getContextValue":{"key":"state"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    resp = wasmxw.call(req, cfg.MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get state from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up state", ["data", data])
    const state = JSON.parse<CurrentState>(data)
    setCurrentState(state);

    calldata = `{"getContextValue":{"key":"mempool"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    resp = wasmxw.call(req, cfg.MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get mempool from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up mempool", ["data", data])
    const mempool = JSON.parse<Mempool>(data)
    setMempool(mempool);

    calldata = `{"getContextValue":{"key":"currentNodeId"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    resp = wasmxw.call(req, cfg.MODULE_NAME);
    if (resp.success > 0) {
        return revert("cannot get currentNodeId from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up currentNodeId", ["data", data])
    const currentNodeId = parseInt32(data);
    setCurrentNodeId(currentNodeId);

    calldata = `{"getContextValue":{"key":"currentTerm"}}`
    req = new CallRequest(oldContract, calldata, BigInt.zero(), 100000000, true);
    resp = wasmxw.call(req, cfg.MODULE_NAME);
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

    // after we set last log index
    initializeVoteArrays(nodeIps.length);

    // TODO we run the hooks that must be ran after block end
    const blockData = getFinalBlock(getLastBlockIndex())
    callHookContract("EndBlock", blockData);
}

export function updateNodeAndReturn(
    params: ActionParam[],
    event: EventObject,
): void {
    let entry = extractUpdateNodeEntryAndVerify(params, event);
    const response = updateNodeEntry(entry);
    console.log("--updateNodeEntry--")
    if (response == null) {
        return;
    }
    console.log("--updateNodeEntry2--")
    const ourId = getCurrentNodeId();
    response.sync_node_id = ourId

    const updateMsgStr = JSON.stringify<UpdateNodeResponse>(response);
    const signature = signMessage(updateMsgStr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(updateMsgStr)));
    const nodeIps = getValidatorNodesInfo();
    const senderaddr = nodeIps[ourId].address;
    const msgstr = `{"run":{"event":{"type":"receiveUpdateNodeResponse","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"},{"key": "sender","value":"${senderaddr}"}]}}}`
    console.log("--updateNodeEntry msgstr--" + msgstr)

    // send update message only to the requesting node
    // other nodes get an updated list each heartbeat
    const peers = [getP2PAddress(entry.node)]
    console.log("--updateNodeAndReturn--" + peers[0])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
}

export function forwardMsgToChat(
    params: ActionParam[],
    event: EventObject,
): void {
    // protocolId as param

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

export function sendBlockProposal(
    params: ActionParam[],
    event: EventObject,
): void {
    let lastIndex = getLastLogIndex();
    const data = prepareAppendEntry(lastIndex);
    const msgstr = prepareAppendEntryMessage(data);
    LoggerDebug("sending block proposal", ["height", lastIndex.toString()])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, msgstr, PROTOCOL_ID, cfg.CHAT_ROOM_BLOCK_PROPOSAL))
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
    const nodes = getValidatorNodesInfo();
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
    const nodeIps = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const peers = [getP2PAddress(nodeIps[leaderId])]

    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const senderaddr = nodeIps[ourId].address;
    const msgstr = `{"run":{"event":{"type":"receiveAppendEntryResponse","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signatureResp}"},{"key": "sender","value":"${senderaddr}"}]}}}`

    LoggerDebug("sending new entries response to proposer", ["proposerId", leaderId.toString(), "lastIndex", response.lastIndex.toString()])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
}

// validator receiving block proposal
export function receiveBlockProposal(
    params: ActionParam[],
    event: EventObject,
): void {
    // here we receive new entries/logs/blocks
    // we need to run ProcessProposal
    // and then FinalizeBlock & Commit
    // TODO we also look at termId, as we might need to rollback changes in case of a network split
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no entry found");
    }
    if (!ctx.has("signature")) {
        revert("no signature found");
    }
    const entryBase64 = ctx.get("entry");
    const signature = ctx.get("signature");
    const entryStr = String.UTF8.decode(decodeBase64(entryBase64).buffer);
    LoggerDebug("received new block proposal", ["block", entryStr.slice(0, cfg.MAX_LOGGED) + " [...]"]);

    let entry: AppendEntry = JSON.parse<AppendEntry>(entryStr);
    LoggerInfo("received new block proposal", [
        "proposerId", entry.proposerId.toString(),
        "termId", entry.termId.toString(),
    ]);

    // verify signature
    const isSender = verifyMessage(entry.proposerId, signature, entryStr);
    if (!isSender) {
        LoggerError("signature verification failed for AppendEntry", ["proposerId", entry.proposerId.toString(), "termId", entry.termId.toString()]);
        return;
    }
    // TODO do we need this?
    setTermId(entry.termId);

    const lastFinalizedBlock = getLastBlockIndex();

    // now we check the new block
    for (let i = 0; i < entry.entries.length; i++) {
        const block = entry.entries[i];
        if (block.index > (lastFinalizedBlock + 1)) {
            // if we are not fully synced, just store the proposal
            // this may be overwritten later
            setLogEntryAggregate(block);
        } else {
            processAppendEntry(entry.entries[i]);
        }
    }
}

// receive new block
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

export function setRoundProposer(
    params: ActionParam[],
    event: EventObject,
): void {
    const validators = getAllValidators();
    const index = calculateCurrentProposer(validators);
    setCurrentProposer(index);
}

export function isNextProposer(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const validators = getAllValidators();
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

export function ifSenderIsProposer(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no entry found");
    }
    const entryBase64 = ctx.get("entry");
    const entryStr = String.UTF8.decode(decodeBase64(entryBase64).buffer);
    let entry: AppendEntry = JSON.parse<AppendEntry>(entryStr);
    const proposerIndex = getCurrentProposer();
    return entry.proposerId == proposerIndex;
}

export function ifNodeIsValidator(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const validators = getAllValidators();
    const nodes = getValidatorNodesInfo();
    const index = getCurrentNodeId();
    return ifNodeIsValidatorInternal(validators, nodes, index);
}

export function ifNodeIsValidatorInternal(validators: staking.Validator[], nodes: NodeInfo[], nodeId: i32): boolean {
    if (validators.length == 1 && nodes.length == 1 && nodeId == 0) return true;
    // we are not synced here:
    if (validators.length == 1 && nodes.length > 1) return false;

    const node = nodes[nodeId];
    for (let i = 0; i < validators.length; i++) {
        if (validators[i].operator_address == node.address) return true;
    }
    return false;
}

export function sendPrevote(
    params: ActionParam[],
    event: EventObject,
): void {
    // get the current proposal & vote on the block hash
    const data = buildPrevoteMessage();
    const msgstr = preparePrevoteMessage(data);
    LoggerDebug("sending prevote", ["index", data.index.toString(), "hash", data.hash])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, msgstr, PROTOCOL_ID, cfg.CHAT_ROOM_PREVOTE))
}

export function buildPrevoteMessage(): Prevote {
    const proposal = getLastLog();
    const blockstr = String.UTF8.decode(decodeBase64(proposal.data).buffer);
    const block = JSON.parse<wblocks.BlockEntry>(blockstr)
    const data = JSON.parse<typestnd.RequestFinalizeBlock>(String.UTF8.decode(decodeBase64(block.data).buffer))
    const hash = data.hash
    const nodeIps = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const senderaddr = nodeIps[ourId].address;
    return new Prevote(senderaddr, block.index, hash);
}

export function preparePrevoteMessage(data: Prevote): string {
    const datastr = JSON.stringify<Prevote>(data);
    const signature = signMessage(datastr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receivePrevote","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    return msgstr
}

export function sendPrecommit(
    params: ActionParam[],
    event: EventObject,
): void {
    // get the current proposal & vote on the block hash
    const data = buildPrecommitMessage();
    const msgstr = preparePrecommitMessage(data);
    LoggerDebug("sending precommit", ["index", data.index.toString(), "hash", data.hash])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, msgstr, PROTOCOL_ID, cfg.CHAT_ROOM_PRECOMMIT))
}

export function buildPrecommitMessage(): Precommit {
    const proposal = getLastLog();
    const blockstr = String.UTF8.decode(decodeBase64(proposal.data).buffer);
    const block = JSON.parse<wblocks.BlockEntry>(blockstr)
    const data = JSON.parse<typestnd.RequestFinalizeBlock>(String.UTF8.decode(decodeBase64(block.data).buffer))
    const hash = data.hash
    const nodeIps = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const senderaddr = nodeIps[ourId].address;
    return new Precommit(senderaddr, block.index, hash);
}

export function preparePrecommitMessage(data: Precommit): string {
    const datastr = JSON.stringify<Precommit>(data);
    const signature = signMessage(datastr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receivePrecommit","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    return msgstr
}

export function receivePrevote(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no entry found");
    }
    if (!ctx.has("signature")) {
        revert("no signature found");
    }
    const entry = ctx.get("entry");
    const signature = ctx.get("signature");

    const datastr = String.UTF8.decode(decodeBase64(entry).buffer)
    const data = JSON.parse<Prevote>(datastr)
    LoggerDebug("prevote received", ["sender", data.sender, "index", data.index.toString(), "hash", data.hash])

    // verify signature
    const isSender = verifyMessageByAddr(data.sender, signature, datastr);
    if (!isSender) {
        LoggerError("signature verification failed for prevote", ["sender", data.sender]);
        return;
    }

    // we add the prevote to the arrays
    const prevoteArr = getPrevoteArray();
    const nodes = getValidatorNodesInfo();
    const nodeIndex = getNodeIdByAddress(data.sender, nodes);
    if (nodeIndex == -1) {
        LoggerError("prevote sender node not found", ["sender", data.sender]);
        return;
    }
    prevoteArr[nodeIndex] = data.index;
    setPrevoteArray(prevoteArr);
}


export function receivePrecommit(
    params: ActionParam[],
    event: EventObject,
): void {
    // we add the precommit to the arrays
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no entry found");
    }
    if (!ctx.has("signature")) {
        revert("no signature found");
    }
    const entry = ctx.get("entry");
    const signature = ctx.get("signature");

    const datastr = String.UTF8.decode(decodeBase64(entry).buffer)
    const data = JSON.parse<Precommit>(datastr)
    LoggerDebug("precommit received", ["sender", data.sender, "index", data.index.toString(), "hash", data.hash])

    // verify signature
    const isSender = verifyMessageByAddr(data.sender, signature, datastr);
    if (!isSender) {
        LoggerError("signature verification failed for precommit", ["sender", data.sender]);
        return;
    }

    // we add the precommit to the arrays
    const precommitArr = getPrecommitArray();
    const nodes = getValidatorNodesInfo();
    const nodeIndex = getNodeIdByAddress(data.sender, nodes);
    if (nodeIndex == -1) {
        LoggerError("precommit sender node not found", ["sender", data.sender]);
        return;
    }
    precommitArr[nodeIndex] = data.index;
    setPrecommitArray(precommitArr);
}

export function ifPrevoteThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const index = getLastLogIndex();
    return readyToPrevote(index);
}

export function ifPrecommitThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const index = getLastLogIndex();
    return readyToPrecommit(index);
}

// this actually commits one block at a time
export function commitBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    const index = getLastLogIndex();
    const lastFinalizedIndex = getLastBlockIndex();
    if (index > lastFinalizedIndex) {
        startBlockFinalizationFollower(index);
    }
}
