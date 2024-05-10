import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import * as wblocks from "wasmx-blocks/assembly/types";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as tnd from "wasmx-tendermint/assembly/actions";
import * as p2pw from "wasmx-p2p/assembly/p2p_wrap";
import * as p2ptypes from "wasmx-p2p/assembly/types";
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
import * as fsm from 'xstate-fsm-as/assembly/storage';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { parseInt32, stringToBase64, base64ToString } from "wasmx-utils/assembly/utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { StateSyncRequest, StateSyncResponse } from "./sync_types";
import { PROTOCOL_ID } from "./config";
import { getCurrentNodeId, getCurrentState, getPrevoteArray, setPrevoteArray, getPrecommitArray, setPrecommitArray, getValidatorNodesInfo, setValidatorNodesInfo, setTermId, appendLogEntry, setLogEntryAggregate, setCurrentState, setLastLogIndex, getValidatorNodeCount, getLogEntryObj } from "./storage";
import { getP2PAddress } from "wasmx-raft-p2p/assembly/actions"
import { callHookContract, setMempool, signMessage } from "wasmx-tendermint/assembly/actions"
import { Mempool } from "wasmx-tendermint/assembly/types_blockchain";
import * as cfg from "./config";
import { AppendEntry, AppendEntryResponse, LogEntryAggregate, UpdateNodeRequest } from "./types";
import { getCurrentProposer, getEmptyPrecommitArray, getEmptyValidatorProposalVoteArray, getFinalBlock, getLastBlockCommit, getLastBlockIndex, getLogEntryAggregate, getNextProposer, initChain, isNodeActive, isPrecommitAcceptThreshold, isPrecommitAnyThreshold, isPrevoteAcceptThreshold, isPrevoteAnyThreshold, prepareAppendEntry, prepareAppendEntryMessage, startBlockFinalizationFollower, startBlockFinalizationFollowerInternal } from "./action_utils";
import { extractUpdateNodeEntryAndVerify, removeNode } from "wasmx-raft/assembly/actions";
import { getLastLogIndex, getTermId, setCurrentNodeId } from "wasmx-raft/assembly/storage";
import { getAllValidators, getNodeByAddress, getNodeIdByAddress, verifyMessage, verifyMessageByAddr } from "wasmx-raft/assembly/action_utils";
import { NodeInfo, NodeUpdate, UpdateNodeResponse } from "wasmx-raft/assembly/types_raft"
import { Commit, CurrentState, SignedMsgType, ValidatorCommitVote, ValidatorProposalVote } from "./types_blockchain";
import { callContract } from "wasmx-tendermint/assembly/actions";
import { InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import * as roles from "wasmx-env/assembly/roles";
import * as mcwrap from 'wasmx-consensus/assembly/multichain_wrap';
import { StartSubChainMsg } from "wasmx-consensus/assembly/types_multichain";


// TODO add delta to timeouts each failed round
// and reset after a successful round

export function connectRooms(
    params: ActionParam[],
    event: EventObject,
): void {
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_PROTOCOL))

    // p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_BLOCK_PROPOSAL))
    // p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_MEMPOOL))
    // p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_NODEINFO))
    // p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_PRECOMMIT))
    // p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(PROTOCOL_ID, cfg.CHAT_ROOM_PREVOTE))
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

// request an update of nodes list & block sync
export function requestBlockSync(
    params: ActionParam[],
    event: EventObject,
): void {
    const nodeId = getCurrentNodeId();
    const nodes = getValidatorNodesInfo()
    for (let i = 0; i < nodes.length; i++) {
        if (nodeId === i || !isNodeActive(nodes[i])) continue;
        sendStateSyncRequest(PROTOCOL_ID, i);
    }
}

export function requestValidatorNodeInfoIfSynced(
    params: ActionParam[],
    event: EventObject,
): void {
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
    if (resp.last_batch_index != resp.last_log_index) return;

    sendNodeSyncRequest(PROTOCOL_ID)
}

export function sendNodeSyncRequest(protocolId: string): void {
    const ips = getValidatorNodesInfo();
    // if we are alone, return
    if (ips.length == 1) {
        return;
    }
    const nodeId = getCurrentNodeId();
    const msgstr = nodeSyncRequestMessage(ips, nodeId);

    // send to all ips except us
    let peers: string[] = []
    for (let i = 0; i < ips.length; i++) {
        // don't send to ourselves or to removed nodes
        if (i == nodeId || ips[i].node.ip == "") continue;
        peers.push(getP2PAddress(ips[i]))
    }

    LoggerInfo("sending node sync request", ["data", msgstr, "peers", peers.join(",")])
    const contract = wasmxw.getAddress();

    // we also post it to the chat room
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, protocolId, peers))
}

// send to all nodes (chat room)
export function registerValidatorWithNetwork(
    params: ActionParam[],
    event: EventObject,
): void {
    // we check that we are registered with the Leader
    // and that we are in sync
    announceValidatorNodeWithNetwork(PROTOCOL_ID);
}

export function announceValidatorNodeWithNetwork(protocolId: string): void {
    const ips = getValidatorNodesInfo();
    // if we are alone, return
    if (ips.length == 1) {
        return;
    }
    const nodeId = getCurrentNodeId();
    const msgstr = announceValidatorNodeWithNetworkMessage(ips, nodeId);
    LoggerInfo("announce node info to network", ["req", msgstr])

    const contract = wasmxw.getAddress();

    // we also post it to the chat room
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, msgstr, protocolId, cfg.CHAT_ROOM_PROTOCOL))
}

export function nodeSyncRequestMessage(ips: NodeInfo[], ourNodeId: i32): string {
    const nodeinfo = ips[ourNodeId];
    // TODO signature on protobuf encoding, not JSON
    const req = new UpdateNodeRequest(getP2PAddress(nodeinfo));
    const reqStr = JSON.stringify<UpdateNodeRequest>(req);
    const signature = signMessage(reqStr);

    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(reqStr)));
    const msgstr = `{"run":{"event":{"type":"receiveUpdateNodeRequest","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"},{"key": "sender","value":"${nodeinfo.address}"}]}}}`
    LoggerInfo("register request", ["req", msgstr])
    return msgstr
}

export function receiveUpdateNodeRequest(
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
    const req = JSON.parse<UpdateNodeRequest>(data)
    LoggerInfo("nodes request update", ["data", data])

    // verify signature
    const isSender = verifyMessageByAddr(sender, signature, data);
    if (!isSender) {
        LoggerError("signature verification failed for UpdateNodeRequest", ["sender", sender]);
        return;
    }
    sendNodeSyncResponse(req.peer_address)
}

export function announceValidatorNodeWithNetworkMessage(ips: NodeInfo[], nodeId: i32): string {
    LoggerInfo("trying to register node with other nodes", []);

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

export function receiveUpdateNodeResponse(
    params: ActionParam[],
    event: EventObject,
): void {
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

    // TODO FROM field: from what peer we have received the message
    // either message is from a known peer, or we verify this signature

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
}

// this is executed each time the node is started in Follower or Candidate state if needed
// and is also called after node registration with the leader
export function sendStateSyncRequest(protocolId: string, nodeId: i32): void {
    const lastIndex = getLastBlockIndex();
    const ourNodeId = getCurrentNodeId()
    const nodes = getValidatorNodesInfo();
    const receiverNode = nodes[nodeId]
    const peerAddress = getP2PAddress(nodes[ourNodeId])
    const request = new StateSyncRequest(lastIndex + 1, peerAddress);
    const datastr = JSON.stringify<StateSyncRequest>(request);
    const signature = signMessage(datastr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const senderaddr = nodes[ourNodeId].address
    const msgstr = `{"run":{"event":{"type":"receiveStateSyncRequest","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"},{"key": "sender","value":"${senderaddr}"}]}}}`

    LoggerInfo("sending statesync request", ["nodeId", nodeId.toString(), "address", receiverNode.address, "data", datastr])

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
        peers[i] = new NodeInfo(addr, new p2ptypes.NetworkNode(p2pid, host, port, parts1[1]), false);
    }
    setValidatorNodesInfo(peers);
    initChain(data);
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
}

// we just add the validator node to our list
export function updateNodeAndReturn(
    params: ActionParam[],
    event: EventObject,
): void {
    let entry = extractUpdateNodeEntryAndVerify(params, event);
    updateNodeEntry(entry);
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

export function sendNodeSyncResponse(peeraddr: string): void {
    const nodes = getValidatorNodesInfo()
    const ourId = getCurrentNodeId();
    const response = new UpdateNodeResponse(nodes, getCurrentNodeId(), getLastLogIndex());
    const updateMsgStr = JSON.stringify<UpdateNodeResponse>(response);
    const signature = signMessage(updateMsgStr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(updateMsgStr)));
    const nodeIps = getValidatorNodesInfo();
    const senderaddr = nodeIps[ourId].address;
    const msgstr = `{"run":{"event":{"type":"receiveUpdateNodeResponse","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"},{"key": "sender","value":"${senderaddr}"}]}}}`

    // send update message only to the requesting node
    // other nodes get an updated list each heartbeat
    const peers = [peeraddr]

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, msgstr, PROTOCOL_ID, peers))
}

export function forwardMsgToChat(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("transaction")) {
        revert("no transaction found");
    }
    const transaction = ctx.get("transaction") // base64
    const msgstr = `{"run":{"event":{"type":"newTransaction","params":[{"key":"transaction", "value":"${transaction}"}]}}}`

    // TODO protocolId as param for what chat room to send it too
    const contract = wasmxw.getAddress();
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, msgstr, PROTOCOL_ID, cfg.CHAT_ROOM_MEMPOOL))
}

export function transitionNodeToValidator(
    params: ActionParam[],
    event: EventObject,
): void {
    // TODO
}

export function newValidatorIsSelf(
    params: ActionParam[],
    event: EventObject,
): boolean {
    // TODO
    return false
}

export function proposeBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    const height = getLastLogIndex();
    let state = getCurrentState()
    if (state.validValue > 0) {
        // we already have this proposal stored
        // so we can return
        return
    }
    // we propose a new block or overwrite any other past proposal
    // we take the last block signed precommits from the current state
    const lastBlockCommit = getLastBlockCommit(height, state);
    const result = tnd.proposeBlockInternalAndStore(lastBlockCommit)
    if (result == null) return;

    state = getCurrentState()
    state.nextHash = result.proposal.hash;
    setCurrentState(state);
}

export function sendBlockProposal(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getCurrentState();
    const data = prepareAppendEntry(state.nextHeight);
    const msgstr = prepareAppendEntryMessage(data);
    LoggerDebug("sending block proposal", ["height", state.nextHeight.toString()])

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
    const entry = ctx.get("entry")
    const data = String.UTF8.decode(decodeBase64(entry).buffer);
    const resp = JSON.parse<StateSyncRequest>(data)

    // we dont verify, because the node may not be a validator
    // TODO non-validators should sync from dedicated nodes

    // we send statesync response with the first batch
    const termId = getTermId()
    const lastIndex = getLastBlockIndex()
    const peers = [resp.peer_address]

    if (lastIndex < resp.start_index) {
        // we nontheless send an empty batch response, because it is used to trigger a node list update
        sendStateSyncBatch(resp.start_index, lastIndex, lastIndex, termId, peers);
        return;
    };

    // send successive messages with max STATE_SYNC_BATCH blocks at a time
    const count = lastIndex - resp.start_index + 1

    LoggerInfo("received statesync request", ["sender", resp.peer_address, "startIndex", resp.start_index.toString(), "lastIndex", lastIndex.toString()])

    const batches = i32(Math.ceil(f64(count)/f64(cfg.STATE_SYNC_BATCH)))
    let startIndex = resp.start_index;
    let lastIndexToSend = startIndex;
    for (let i = 0; i < batches - 1; i++) {
        lastIndexToSend = startIndex + cfg.STATE_SYNC_BATCH - 1
        sendStateSyncBatch(startIndex, lastIndexToSend, lastIndex, termId, peers);
        startIndex += cfg.STATE_SYNC_BATCH
    }
    if (lastIndexToSend <= lastIndex) {
        // last batch
        sendStateSyncBatch(startIndex, lastIndex, lastIndex, termId, peers);
    }
    LoggerInfo("statesync request processed", ["sender", resp.peer_address, "startIndex", resp.start_index.toString(), "lastIndex", lastIndex.toString(), "batches", batches.toString()])
}

function sendStateSyncBatch(start_index: i64, lastIndexToSend: i64, lastIndex: i64, termId: i32, peers: string[]): void {
    const entries: Array<LogEntryAggregate> = [];
    for (let i = start_index; i <= lastIndexToSend; i++) {
        const entry = getLogEntryAggregate(i);
        entries.push(entry);
    }

    // we do not sign this message, because the receiver may not have our publicKey

    const response = new StateSyncResponse(start_index, lastIndexToSend, lastIndex, termId, entries);
    const datastr = JSON.stringify<StateSyncResponse>(response);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const nodes = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const senderaddr = nodes[ourId].address;
    const msgstr = `{"run":{"event":{"type":"receiveStateSyncResponse","params":[{"key": "entry","value":"${dataBase64}"},{"key": "sender","value":"${senderaddr}"}]}}}`
    LoggerDebug("sending state sync chunk", ["count", response.entries.length.toString(), "from", start_index.toString(), "to", lastIndexToSend.toString(), "last_index", lastIndex.toString()])

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

    const lastIndex = getLastBlockIndex()
    if (lastIndex >= resp.last_batch_index) return;

    let nextIndex = lastIndex+1

    LoggerInfo("received statesync response", ["count", resp.entries.length.toString(), "from", resp.start_batch_index.toString(), "to", resp.last_batch_index.toString(), "last_log_index", resp.last_log_index.toString()])

    // now we check the new block
    for (let i = 0; i < resp.entries.length; i++) {
        const block = resp.entries[i]
        // processAppendEntry(resp.entries[i]);
        storeNewBlockOutOfOrder(block.termId, block, nextIndex)
        startBlockFinalizationFollowerInternal(block);
        nextIndex += 1;
    }
    setTermId(resp.termId);
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
    if (!ctx.has("sender")) {
        revert("no sender found");
    }
    const entryBase64 = ctx.get("entry");
    const signature = ctx.get("signature");
    const sender = ctx.get("sender");
    const entryStr = String.UTF8.decode(decodeBase64(entryBase64).buffer);
    LoggerDebugExtended("received new block proposal", ["block", entryStr]);

    let entry: AppendEntry = JSON.parse<AppendEntry>(entryStr);
    LoggerInfo("received new block proposal", [
        "proposerId", entry.proposerId.toString(),
        "termId", entry.termId.toString(),
        "sender", sender,
    ]);

    // verify signature
    const isSender = verifyMessageByAddr(sender, signature, entryStr);
    if (!isSender) {
        LoggerError("signature verification failed for AppendEntry", ["proposerId", entry.proposerId.toString(), "sender", sender, "termId", entry.termId.toString()]);
        return;
    }

    // const state = getCurrentState()

    const termId = getTermId()
    if (termId > entry.termId) return;

    if (termId < entry.termId) {
        // we are out of sync
        // revert(`Round index mismatch; expected ${termId}, received ${entry.termId}`)
        // TDODO fixme - how do we sync termId???
        setTermId(entry.termId)

        // TODO catch up nextProposer queue ?
        // no new blocks were produced, so the same stake will be used
    }

    // now we check the new block
    for (let i = 0; i < entry.entries.length; i++) {
        const block = entry.entries[i];
        // we only receive block proposals if we are synced
        // if we are not synced, we use Commit messages
        processAppendEntry(block);
        // storeNewBlockOutOfOrder(entry.termId, block, state.nextHeight);
    }
}

// receive new block
export function processAppendEntry(entry: LogEntryAggregate): void {
    const data = decodeBase64(entry.data.data);
    const processReq = JSON.parse<typestnd.RequestProcessProposal>(String.UTF8.decode(data.buffer));

    // TODO check all the validator signatures on the previous block, for correctness
    // TODO do we compare with our own signatures?
    // entry.data.last_commit

    const processResp = consensuswrap.ProcessProposal(processReq);
    if (processResp.status === typestnd.ProposalStatus.REJECT) {
        // TODO - what to do here? returning just discards the block and does not return a response to the leader
        // but this node will not sync with the leader anymore
        LoggerError("new block rejected", ["height", processReq.height.toString(), "node type", "Follower"])
        return;
    }
    appendLogEntry(entry);

    // set hash for the proposal we have accepted
    const state = getCurrentState()
    state.nextHash = processReq.hash
    setCurrentState(state);
}

export function setRoundProposer(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId();
    const currentState = getCurrentState();

    // >= ?? (sometimes we update termId from other nodes)
    if (currentState.proposerQueueTermId == termId) return;

    const validators = getAllValidators();
    const resp = getNextProposer(validators, currentState.proposerQueue);
    currentState.proposerIndex = resp.proposerIndex;
    currentState.proposerQueueTermId = termId;
    currentState.proposerQueue = resp.proposerQueue;
    setCurrentState(currentState);
    LoggerDebug("new proposer set", ["validator_index", resp.proposerIndex.toString(), "termId", termId.toString()])
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

    const prevoteArr = getPrevoteArray();
    prevoteArr[getCurrentNodeId()] = data;
    setPrevoteArray(prevoteArr);

    const msgstr = preparePrevoteMessage(data);
    LoggerDebug("sending prevote", ["index", data.index.toString(), "hash", data.hash])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, msgstr, PROTOCOL_ID, cfg.CHAT_ROOM_PREVOTE))
}

export function sendPrevoteNil(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId()
    const state = getCurrentState()
    const nextIndex = state.nextHeight;
    const nodeIps = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const getOurInfo = nodeIps[ourId];

    const vaddr = wasmxw.addr_humanize(decodeBase64(state.validator_pubkey).buffer)
    const consAddr = getOurInfo.address
    // TODO chainId
    const data = new ValidatorProposalVote(SignedMsgType.SIGNED_MSG_TYPE_PREVOTE, termId, consAddr, ourId, nextIndex, "nil", new Date(Date.now()), "")

    const prevoteArr = getPrevoteArray();
    prevoteArr[getCurrentNodeId()] = data;
    setPrevoteArray(prevoteArr);

    const msgstr = preparePrevoteMessage(data);
    LoggerDebug("sending prevote nil", ["index", data.index.toString()])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, msgstr, PROTOCOL_ID, cfg.CHAT_ROOM_PREVOTE))
}

export function buildPrevoteMessage(): ValidatorProposalVote {
    const nodeIps = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const nodeInfo = nodeIps[ourId];
    const state = getCurrentState();
    const vaddr = wasmxw.addr_humanize(decodeBase64(state.validator_pubkey).buffer)
    const consAddr = nodeInfo.address
     // TODO chainId
    return new ValidatorProposalVote(SignedMsgType.SIGNED_MSG_TYPE_PREVOTE, getTermId(), consAddr, ourId, state.nextHeight, state.nextHash, new Date(Date.now()), "");
}

export function preparePrevoteMessage(data: ValidatorProposalVote): string {
    const datastr = JSON.stringify<ValidatorProposalVote>(data);
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
    const resp = preparePrecommitMessage(data);
    const msgstr = resp[0]
    const signature = resp[1]
    LoggerDebug("sending precommit", ["index", data.index.toString(), "hash", data.hash])

    const arr = getPrecommitArray();
    arr[getCurrentNodeId()] = new ValidatorCommitVote(data, typestnd.BlockIDFlag.Commit, signature)
    setPrecommitArray(arr);

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, msgstr, PROTOCOL_ID, cfg.CHAT_ROOM_PRECOMMIT))
}

export function sendPrecommitNil(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId()
    const state = getCurrentState()
    const nextIndex = state.nextHeight;
    const nodeIps = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const getOurInfo = nodeIps[ourId];
    const vaddr = wasmxw.addr_humanize(decodeBase64(state.validator_pubkey).buffer)
    const consAddr = getOurInfo.address
    // TODO chainId
    const data = new ValidatorProposalVote(SignedMsgType.SIGNED_MSG_TYPE_PRECOMMIT, termId, consAddr, ourId, nextIndex, "nil", new Date(Date.now()), "")

    const resp = preparePrecommitMessage(data);
    const msgstr = resp[0]
    const signature = resp[1]
    LoggerDebug("sending precommit nil", ["index", data.index.toString()])

    const arr = getPrecommitArray();
    arr[getCurrentNodeId()] = new ValidatorCommitVote(data, typestnd.BlockIDFlag.Nil, signature)
    setPrecommitArray(arr);

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, msgstr, PROTOCOL_ID, cfg.CHAT_ROOM_PREVOTE))
}

export function buildPrecommitMessage(): ValidatorProposalVote {
    const nodeIps = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const nodeInfo = nodeIps[ourId];
    const state = getCurrentState();
    const vaddr = wasmxw.addr_humanize(decodeBase64(state.validator_pubkey).buffer)
    const consAddr = nodeInfo.address
    // TODO chainId
    return new ValidatorProposalVote(SignedMsgType.SIGNED_MSG_TYPE_PRECOMMIT, getTermId(), consAddr, ourId, state.nextHeight, state.nextHash, new Date(Date.now()), "");
}

export function preparePrecommitMessage(data: ValidatorProposalVote): string[] {
    const datastr = JSON.stringify<ValidatorProposalVote>(data);
    const signature = signMessage(datastr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receivePrecommit","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    return [msgstr, signature]
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
    const data = JSON.parse<ValidatorProposalVote>(datastr)
    LoggerDebug("prevote received", ["sender", data.validatorAddress, "index", data.index.toString(), "hash", data.hash])

    const state = getCurrentState();
    if (state.nextHeight != data.index) return;

    // verify signature
    const isSender = verifyMessageByAddr(data.validatorAddress, signature, datastr);
    if (!isSender) {
        LoggerError("signature verification failed for prevote", ["sender", data.validatorAddress]);
        return;
    }

    // we add the prevote to the arrays
    const prevoteArr = getPrevoteArray();
    const nodes = getValidatorNodesInfo();
    const nodeIndex = getNodeIdByAddress(data.validatorAddress, nodes);
    if (nodeIndex == -1) {
        LoggerError("prevote sender node not found", ["sender", data.validatorAddress]);
        return;
    }
    prevoteArr[nodeIndex] = data;
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
    const data = JSON.parse<ValidatorProposalVote>(datastr)
    LoggerDebug("precommit received", ["sender", data.validatorAddress, "index", data.index.toString(), "hash", data.hash])

    const state = getCurrentState();
    if (state.nextHeight != data.index) return;

    // verify signature
    const isSender = verifyMessageByAddr(data.validatorAddress, signature, datastr);
    if (!isSender) {
        LoggerError("signature verification failed for precommit", ["sender", data.validatorAddress]);
        return;
    }

    // we add the precommit to the arrays
    const precommitArr = getPrecommitArray();
    const nodes = getValidatorNodesInfo();
    const nodeIndex = getNodeIdByAddress(data.validatorAddress, nodes);
    if (nodeIndex == -1) {
        LoggerError("precommit sender node not found", ["sender", data.validatorAddress]);
        return;
    }
    precommitArr[nodeIndex].vote = data;
    precommitArr[nodeIndex].signature = signature;
    if (data.hash != "" && data.hash != "nil") {
        precommitArr[nodeIndex].block_id_flag = typestnd.BlockIDFlag.Commit
    } else {
        precommitArr[nodeIndex].block_id_flag = typestnd.BlockIDFlag.Nil
    }
    setPrecommitArray(precommitArr);
}

export function ifPrevoteAnyThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return isPrevoteAnyThreshold();
}

export function ifPrevoteAcceptThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const state = getCurrentState()
    if (state.nextHash == "") {
        return false;
    }
    return isPrevoteAcceptThreshold(state.nextHash);
}

export function ifPrecommitAnyThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return isPrecommitAnyThreshold();
}

export function ifPrecommitAcceptThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const state = getCurrentState()
    if (state.nextHash == "") {
        return false;
    }
    return isPrecommitAcceptThreshold(state.nextHash);
}

// this actually commits one block at a time
export function commitBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getCurrentState();
    const lastFinalizedIndex = getLastBlockIndex();
    if (state.nextHeight > lastFinalizedIndex) {
        const state = getCurrentState();
        state.last_round = getTermId();
        setCurrentState(state);
        startBlockFinalizationFollower(state.nextHeight);
    }
}

export function resetPrevotes(
    params: ActionParam[],
    event: EventObject,
): void {
    const count = getValidatorNodeCount();
    const emptyarr = getEmptyValidatorProposalVoteArray(count, SignedMsgType.SIGNED_MSG_TYPE_PREVOTE);
    setPrevoteArray(emptyarr);
}

export function resetPrecommits(
    params: ActionParam[],
    event: EventObject,
): void {
    // TODO all validators, only bonded validators???
    const validators = getAllValidators();
    const emptyarr = getEmptyPrecommitArray(validators.length, SignedMsgType.SIGNED_MSG_TYPE_PRECOMMIT);
    setPrecommitArray(emptyarr);
}

export function setLockedValue(
    params: ActionParam[],
    event: EventObject,
): void {
    // we mark the current height as locked
    const state = getCurrentState()
    state.lockedValue = state.nextHeight
    setCurrentState(state)
}

export function setLockedRound(
    params: ActionParam[],
    event: EventObject,
): void {
    // we mark the current round as locked
    const termId = getTermId()
    const state = getCurrentState()
    state.lockedRound = termId
    setCurrentState(state)
}

export function setValidValue(
    params: ActionParam[],
    event: EventObject,
): void {
    // we mark the current height as valid
    const state = getCurrentState()
    state.validValue = state.nextHeight
    setCurrentState(state)
}

export function setValidRound(
    params: ActionParam[],
    event: EventObject,
): void {
    // we mark the current round as locked
    const termId = getTermId()
    const state = getCurrentState()
    state.validRound = termId
    setCurrentState(state)
}

export function resetLockedValue(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getCurrentState()
    state.lockedValue = 0
    setCurrentState(state)
}

export function resetLockedRound(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getCurrentState()
    state.lockedRound = 0
    setCurrentState(state)
}

export function resetValidValue(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getCurrentState()
    state.validValue = 0
    state.nextHash = "";
    setCurrentState(state)
}

export function resetValidRound(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getCurrentState()
    state.validRound = 0
    setCurrentState(state)
}

export function buildCommitMessage(): Commit {
    const state = getCurrentState();
    const termId = getTermId();

    // this is after commitBlock!!, where we increment the block height
    const index = state.nextHeight - 1;
    // before resetValidValue!
    const hash = state.nextHash
    const entry = getLogEntryAggregate(index)
    const entryStr = JSON.stringify<LogEntryAggregate>(entry)
    const entryBase64 = stringToBase64(entryStr)

    // TODO !!!
    // const precommits = getPrecommitArray() // must store sigs too
    const signatures: Base64String[] = []

    return new Commit(index, termId, hash, signatures, entryBase64)
}

export function sendCommit(
    params: ActionParam[],
    event: EventObject,
): void {
    // get the current proposal & vote on the block hash
    const data = buildCommitMessage();
    const datastr = JSON.stringify<Commit>(data);
    const dataBase64 = stringToBase64(datastr);
    const msgstr = `{"run":{"event":{"type":"receiveCommit","params":[{"key": "entry","value":"${dataBase64}"}]}}}`

    LoggerDebug("sending commit", ["index", data.index.toString(), "hash", data.hash])

    const contract = wasmxw.getAddress();
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, msgstr, PROTOCOL_ID, cfg.CHAT_ROOM_PROTOCOL))
}

export function receiveCommit(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("entry")) {
        revert("no entry found");
    }
    const entry = ctx.get("entry");

    // TODO maybe needed for synced validators too, to verify our state
    // otherwise, used by normal nodes or syncing validators

    // we can just verify the block data & precommit signatures

    const datastr = base64ToString(entry)
    const data = JSON.parse<Commit>(datastr)
    LoggerDebug("commit received", ["index", data.index.toString(), "hash", data.hash])

    const lastIndex = getLastBlockIndex()
    if (lastIndex >= data.index) return;

    const entryStr = base64ToString(data.data)
    const block = JSON.parse<LogEntryAggregate>(entryStr)
    const state = getCurrentState()

    // we store the block temporarily;
    storeNewBlockOutOfOrder(data.termId, block, state.nextHeight)

    // TODO state sync better with verification of votes, etc.
    // but now we just try to finalize blocks until this height
    const lastFinalizedIndex = getLastBlockIndex();
    for (let i = lastFinalizedIndex + 1; i <= data.index; i++) {
        // if empty block, we renounce
        if (getLogEntryObj(i).index == 0) {
            break;
        }
        startBlockFinalizationFollower(i);
    }
    // update term id
    setTermId(data.termId)
}

// currentState.nextHeight
export function storeNewBlockOutOfOrder(blockTermId: i64, block: LogEntryAggregate, nextHeight: i64): void {
    if (block.index > nextHeight) {
        // if we are not fully synced, just store the proposal with highest termId / round
        const lastIndex = getLastLogIndex();
        // we already have a proposal for this height
        if (lastIndex >= block.index) {
            const existent = getLogEntryObj(block.index)
            // even if this entry is missing, it will have termId 0
            if (existent.termId < block.termId) setLogEntryAggregate(block);
        } else {
            setLastLogIndex(block.index);
        }
    } else if (block.index == nextHeight) {
        processAppendEntry(block);
    }
}

export function StartNode(): void {
    // call chain registry & get all subchains & start each node
    const calldatastr = `{"GetSubChains":{}}`;
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY, calldatastr, true);
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`call failed`, ["contract", roles.ROLE_MULTICHAIN_REGISTRY, "error", resp.data])
        return
    }
    const chains = JSON.parse<InitSubChainDeterministicRequest[]>(resp.data);
    LoggerInfo("starting subchains", ["count", chains.length.toString()])
    for (let i = 0; i < chains.length; i++) {
        const chain = chains[i];
        LoggerInfo("starting subchain", ["subchain_id", chain.init_chain_request.chain_id])
        const resp = mcwrap.StartSubChain(new StartSubChainMsg(chain.init_chain_request.chain_id, chain.chain_config))
        if (resp.error.length > 0) {
            LoggerError("could not start subchain", ["subchain_id", chain.init_chain_request.chain_id])
        }
    }
}

