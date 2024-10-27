import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly"
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as tnd from "wasmx-tendermint/assembly/actions";
import * as p2pw from "wasmx-p2p/assembly/p2p_wrap";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import { NodeInfo } from "wasmx-p2p/assembly/types";
import { LoggerDebug, LoggerInfo, LoggerError, revert, LoggerDebugExtended } from "./utils";
import {
  Base64String,
  CallRequest,
} from 'wasmx-env/assembly/types';
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as staking from "wasmx-stake/assembly/types";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { parseInt32, stringToBase64, base64ToString, hex64ToBase64, base64ToHex } from "wasmx-utils/assembly/utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { StateSyncRequest, StateSyncResponse } from "./sync_types";
import { getCurrentNodeId, getCurrentState, getValidatorNodesInfo, setValidatorNodesInfo, setTermId, appendLogEntry, setLogEntryAggregate, setCurrentState, setLastLogIndex, getLogEntryObj, addToPrevoteArray, addToPrecommitArray, setPrevoteArrayMap, getPrevoteArrayMap, getPrecommitArrayMap, setPrecommitArrayMap, resetPrecommitArray } from "./storage";
import * as raftp2pactions from "wasmx-raft-p2p/assembly/actions";
import { setMempool, signMessage } from "wasmx-tendermint/assembly/actions"
import { CurrentState, Mempool, ValidatorQueueEntry } from "wasmx-tendermint/assembly/types_blockchain";
import * as cfg from "./config";
import { AppendEntry, LogEntryAggregate, NodeInfoRequest, UpdateNodeRequest, UpdateNodeResponse } from "./types";
import { getAllValidatorInfos, getTendermintVote, getCurrentProposer, getLastBlockCommit, getLastBlockIndex, getLogEntryAggregate, getNextProposer, getProtocolId, getProtocolIdInternal, getTopic, getTopicInternal, initChain, isNodeActive, isPrecommitAcceptThreshold, isPrecommitAnyThreshold, isPrevoteAcceptThreshold, isPrevoteAnyThreshold, prepareAppendEntry, prepareAppendEntryMessage, startBlockFinalizationFollower, startBlockFinalizationFollowerInternal, storageBootstrapAfterStateSync, getConsensusParams, weAreNotAlone, weAreNotAloneInternal, parseNodeAddress, updateNodeEntry, nodeInfoComplete, nodeInfoCompleteInternal } from "./action_utils";
import { extractUpdateNodeEntryAndVerify, removeNode } from "wasmx-raft/assembly/actions";
import { getLastLogIndex, getTermId, setCurrentNodeId } from "wasmx-raft/assembly/storage";
import { getAllValidators, getNodeIdByAddress, verifyMessageByAddr, verifyMessageBytesByAddr } from "wasmx-raft/assembly/action_utils";
import { NodeUpdate } from "wasmx-raft/assembly/types_raft"
import { Commit, getEmptyPrecommitArray, getEmptyValidatorProposalVoteArray, SignedMsgType, ValidatorCommitVote, ValidatorProposalVote } from "./types_blockchain";
import { callContract } from "wasmx-tendermint/assembly/actions";
import { NodePorts } from "wasmx-consensus/assembly/types_multichain";
import * as roles from "wasmx-env/assembly/roles";
import * as mcwrap from 'wasmx-consensus/assembly/multichain_wrap';
import { decodeTx } from "wasmx-tendermint/assembly/action_utils";
import { getLeaderChain } from "wasmx-consensus/assembly/multichain_utils";
import { cleanAbsentCommits, getActiveValidatorInfo, getSortedBlockCommits, sortTendermintValidators } from "wasmx-consensus-utils/assembly/utils";

// TODO add delta to timeouts each failed round
// and reset after a successful round

export function connectRooms(
    params: ActionParam[],
    event: EventObject,
): void {
    connectRoomsInternal()
}

export function connectRoomsInternal(): void {
    const state = getCurrentState()
    const protocolId = getProtocolId(state)
    const topic = getTopic(state, cfg.CHAT_ROOM_PROTOCOL)
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(protocolId, topic))

    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(protocolId, getTopic(state, cfg.CHAT_ROOM_CROSSCHAIN_MEMPOOL)))
}

function disconnectRooms(): void {
    const state = getCurrentState()
    const protocolId = getProtocolId(state)
    p2pw.DisconnectChatRoom(new p2ptypes.DisconnectChatRoomRequest(protocolId, getTopic(state, cfg.CHAT_ROOM_PROTOCOL)))
    p2pw.DisconnectChatRoom(new p2ptypes.DisconnectChatRoomRequest(protocolId, getTopic(state, cfg.CHAT_ROOM_CROSSCHAIN_MEMPOOL)))
}

export function connectPeers(
    params: ActionParam[],
    event: EventObject,
): void {
    const protocolId = getProtocolId(getCurrentState())
    connectPeersInternal(protocolId);
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
        const p2paddr = raftp2pactions.getP2PAddress(nodeInfos[i])
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
    const protocolId = getProtocolId(getCurrentState())
    for (let i = 0; i < nodes.length; i++) {
        if (nodeId === i || !isNodeActive(nodes[i])) continue;
        sendStateSyncRequest(protocolId, i);
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

    const protocolId = getProtocolId(getCurrentState())
    sendNodeSyncRequest(protocolId)
}

export function sendNodeSyncRequest(protocolId: string): void {
    const ips = getValidatorNodesInfo();
    if (!weAreNotAloneInternal(ips)) {
        return;
    }
    const nodeId = getCurrentNodeId();
    const msgstr = nodeSyncRequestMessage(ips, nodeId);

    // send to all ips except us
    let peers: string[] = []
    for (let i = 0; i < ips.length; i++) {
        // don't send to ourselves or to removed nodes
        if (i == nodeId || ips[i].node.ip == "") continue;
        peers.push(raftp2pactions.getP2PAddress(ips[i]))
    }

    LoggerInfo("sending node sync request", ["data", msgstr, "peers", peers.join(",")])
    const contract = wasmxw.getAddress();

    // we also post it to the chat room
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, contract, msgstr, protocolId, peers))
}

// send to all nodes (chat room)
export function registerValidatorWithNetwork(
    params: ActionParam[],
    event: EventObject,
): void {
    // we check that we are registered with the Leader
    // and that we are in sync
    const state = getCurrentState()
    const protocolId = getProtocolId(state)
    const topic = getTopic(state, cfg.CHAT_ROOM_PROTOCOL)
    announceValidatorNodeWithNetwork(protocolId, topic);
}

export function announceValidatorNodeWithNetwork(protocolId: string, topic: string): void {
    const ips = getValidatorNodesInfo();
    if (!weAreNotAloneInternal(ips)) {
        return;
    }
    const nodeId = getCurrentNodeId();
    const msgstr = announceValidatorNodeWithNetworkMessage(ips, nodeId);
    LoggerInfo("announce node info to network", ["req", msgstr])

    const contract = wasmxw.getAddress();

    // we also post it to the chat room
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, msgstr, protocolId, topic))
}

export function nodeSyncRequestMessage(ips: NodeInfo[], ourNodeId: i32): string {
    const nodeinfo = ips[ourNodeId];
    // TODO signature on protobuf encoding, not JSON
    const req = new UpdateNodeRequest(raftp2pactions.getP2PAddress(nodeinfo));
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

    // we dont verify the signature, we allow anyone to get the nodes list, so nodes can sync before becoming a validator
    // verify signature
    // const isSender = verifyMessageByAddr(sender, signature, data);
    // if (!isSender) {
    //     LoggerError("signature verification failed for UpdateNodeRequest", ["sender", sender]);
    //     return;
    // }
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
    receiveUpdateNodeResponseInternal(params, event)
}

export function receiveUpdateNodeResponseInternal(
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

    // update proposer queue
    const state = getCurrentState()
    state.proposerIndex = resp.proposerIndex;
    state.proposerQueue = resp.proposerQueue;
    state.proposerQueueTermId = resp.proposerQueueTermId;
    setCurrentState(state);

    // we find our id
    let ourId = -1;
    for (let j = 0; j < resp.nodes.length; j++) {
        if (resp.nodes[j].address == nodeInfo.address) {
            ourId = j;
            break;
        }
    }
    // if we do not find it, we add ourselves
    // we should only receive this type of message after bootstrap, when we have id 0
    if (ourId == -1) {
        if (nodeId == 0) {
            LoggerInfo("node list does not contain our node, adding it", [])
            resp.nodes.push(nodeInfo)
            setValidatorNodesInfo(resp.nodes)
            setCurrentNodeId(resp.nodes.length - 1);
        } else {
            LoggerError("node list does not contain our node", [])
        }
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
// TODO if out of sync > 1000 blocks -> state sync
export function sendStateSyncRequest(protocolId: string, nodeId: i32): void {
    const nodes = getValidatorNodesInfo();
    if (!weAreNotAloneInternal(nodes)) {
        return;
    }
    const lastIndex = getLastBlockIndex();
    const ourNodeId = getCurrentNodeId()

    const receiverNode = nodes[nodeId]
    const peerAddress = raftp2pactions.getP2PAddress(nodes[ourNodeId])
    const request = new StateSyncRequest(lastIndex + 1, peerAddress);
    const datastr = JSON.stringify<StateSyncRequest>(request);
    const signature = signMessage(datastr);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const senderaddr = nodes[ourNodeId].address
    const msgstr = `{"run":{"event":{"type":"receiveStateSyncRequest","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"},{"key": "sender","value":"${senderaddr}"}]}}}`

    LoggerInfo("sending statesync request", ["nodeId", nodeId.toString(), "address", receiverNode.address, "data", datastr])

    const peers = [raftp2pactions.getP2PAddress(receiverNode)]
    const contract = wasmxw.getAddress();
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, contract, msgstr, protocolId, peers))
}

export function setupNode(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("data")) {
        revert("no initChainSetup found");
    }
    const initChainSetup = ctx.get("data") // base64

    // TODO ID@host:ip
    // 6efc12ab37fc0e096d8618872f6930df53972879@0.0.0.0:26757

    const datajson = String.UTF8.decode(decodeBase64(initChainSetup).buffer);
    // TODO remove validator private key from logs in initChainSetup
    LoggerDebug("setupNode", ["initChainSetup", datajson])
    const data = JSON.parse<typestnd.InitChainSetup>(datajson);
    fsm.setContextValue(cfg.CURRENT_NODE_ID, data.node_index.toString());

    const peers = new Array<NodeInfo>(data.peers.length);
    for (let i = 0; i < data.peers.length; i++) {
        const resp = parseNodeAddress(data.peers[i]);
        if (resp.error.length > 0 || resp.node_info == null) {
            revert(resp.error);
            return;
        } else {
            peers[i] = resp.node_info!;
        }
    }
    setValidatorNodesInfo(peers);
    initChain(data);

    // set initial ports on multichain registry local
    // we only use this on level0 now
    // we may decide to use them on each level later (hierarchically)


    const calldatastr = `{"SetInitialPorts":{"initialPorts":${JSON.stringify<NodePorts>(data.initial_ports)}}}`;
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY_LOCAL, calldatastr, false);
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`call failed: could not set initial ports`, ["contract", roles.ROLE_MULTICHAIN_REGISTRY_LOCAL, "error", resp.data])
    }
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

export function bootstrapAfterStateSync(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("state")) {
        revert("no state found");
    }
    const statestr = base64ToString(ctx.get("state"))
    const state = JSON.parse<typestnd.State>(statestr);

    const lastBlockId = new typestnd.BlockID(
        state.LastBlockID.hash.toLowerCase(),
        new typestnd.PartSetHeader(state.LastBlockID.parts.total, state.LastBlockID.parts.hash.toLowerCase()),
    )
    // update CurrentState
    const currentState = getCurrentState();
    currentState.chain_id = state.ChainID
    currentState.version = state.Version
    currentState.app_hash = state.AppHash
    currentState.last_block_id = lastBlockId
    currentState.last_results_hash = state.LastResultsHash
    currentState.last_time = state.LastBlockTime.toISOString()
    // TODO
    // currentState.last_commit_hash
    currentState.last_round = 0
    // currentState.last_block_signatures
    currentState.nextHeight = state.LastBlockHeight + 1
    currentState.nextHash = ""

    // these are updated when we update our node list
    // currentState.proposerQueue
    // currentState.proposerQueueTermId
    // currentState.proposerIndex

    setCurrentState(currentState)

    // update storage contract
    // update last block height
    storageBootstrapAfterStateSync(state.LastBlockHeight, state.LastHeightConsensusParamsChanged, state.ConsensusParams);

    // update our last log here
    setLastLogIndex(state.LastBlockHeight)

    // we need an updated node list before we can create our validator
    // so we request this from our peer
    connectRoomsInternal()
    const protocolId = getProtocolId(getCurrentState())
    sendNodeSyncRequest(protocolId)


    // TODO we now do not sync the last seen commit signatures for previous block, in case this validator is the next proposer
    // so we will just skip the proposal creation for now

    // TODO set next validators
    // validators come with operator_address empty
    // we dont set this now, as they are recalculated when building the block proposal
    // but this may not be correct in some edge cases that I dont want to tackle now
}

export function getNodeInfo(
    params: ActionParam[],
    event: EventObject,
): void {
    const nodes = getValidatorNodesInfo();
    const currentId = getCurrentNodeId();
    const resp = String.UTF8.encode(JSON.stringify<NodeInfo>(nodes[currentId]))
    wasmx.setFinishData(resp)
}

export function commitAfterStateSync(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("commit")) {
        revert("no state found");
    }
    const commitstr = ctx.get("commit") // stringified message
    const commit = JSON.parse<typestnd.BlockCommit>(commitstr);
    // TODO update prevote / precommit array
}

// we just add the validator node to our list
export function updateNodeAndReturn(
    params: ActionParam[],
    event: EventObject,
): void {
    let entry = extractUpdateNodeEntryAndVerify(params, event);
    updateNodeEntry(entry);
}


export function sendNodeSyncResponse(peeraddr: string): void {
    const nodes = getValidatorNodesInfo()
    const ourId = getCurrentNodeId();
    const state = getCurrentState();
    const response = new UpdateNodeResponse(nodes, getCurrentNodeId(), getLastLogIndex(), state.proposerQueue, state.proposerQueueTermId, state.proposerIndex);
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
    const protocolId = getProtocolId(getCurrentState())
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, contract, msgstr, protocolId, peers))
}

export function forwardMsgToChat(
    params: ActionParam[],
    event: EventObject,
): void {
    if (!weAreNotAlone()) {
        return;
    }
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("transaction")) {
        revert("no transaction found");
    }
    const transaction = ctx.get("transaction") // base64
    const msgstr = `{"run":{"event":{"type":"newTransaction","params":[{"key":"transaction", "value":"${transaction}"}]}}}`

    // TODO protocolId as param for what chat room to send it too
    const contract = wasmxw.getAddress();
    const state = getCurrentState()
    const protocolId = getProtocolId(state)
    const topic = getTopic(state, cfg.CHAT_ROOM_MEMPOOL)
    LoggerDebug("forwarding transaction to other nodes", ["topic", topic, "protocolId", protocolId])
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, msgstr, protocolId, topic))
}

// TODO
export function forwardMsgToOtherChains(transaction: Base64String, chainIds: string[]): void {
    if (!weAreNotAlone()) {
        return;
    }
    const msgstr = `{"run":{"event":{"type":"newTransaction","params":[{"key":"transaction", "value":"${transaction}"}]}}}`
    // const contractAddr = wasmx.getAddress();
    // const fromcontract = wasmxw.getAddress();
    LoggerDebug("forwarding transaction to chains", ["chain_ids", chainIds.join(",")])
    for (let i = 0; i < chainIds.length; i++) {
        const chainId = chainIds[i]
        const protocolId = getProtocolIdInternal(chainId)
        const topic = getTopicInternal(chainId, cfg.CHAT_ROOM_CROSSCHAIN_MEMPOOL)
        LoggerDebug("forwarding transaction to chain", ["chain_id", chainId, "topic", topic, "protocolId", protocolId])

        // TODO contract address should be consensus role
        // let tocontract = base64.encode(Uint8Array.wrap(contractAddr))
        const tocontract = roles.ROLE_CONSENSUS
        const fromcontract = roles.ROLE_CONSENSUS

        p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(tocontract, fromcontract, msgstr, protocolId, topic))
    }
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
    addTransactionToMempool(transaction)
}

export function addTransactionToMempool(
    transaction: Base64String,
): string {
    const txhash = wasmxw.sha256(transaction);
    const mempool = tnd.getMempool();
    mempool.seen(txhash);
    setMempool(mempool);

    const parsedTx = decodeTx(transaction);
    let txGas: u64 = 1000000
    const fee = parsedTx.auth_info.fee
    if (fee != null) {
        txGas = fee.gas_limit
    }

    const cparams = getConsensusParams(0);
    const maxgas = cparams.block.max_gas;
    if (maxgas > -1 && u64(maxgas) < txGas) {
        revert(`out of gas: ${txGas}; max ${maxgas}`);
        return "";
    }

    // if atomic transaction, we calculate the leader chain id and index it by leader
    // we revert if extension leader is incorrect
    const extopts = parsedTx.body.extension_options
    let leader = ""
    let atomicChains: string[] = []
    for (let i = 0; i < extopts.length; i++) {
        const extany = extopts[i]
        if (extany.type_url == typestnd.TypeUrl_ExtensionOptionAtomicMultiChainTx) {
            const ext = typestnd.ExtensionOptionAtomicMultiChainTx.fromAnyWrap(extany)
            const ourchain = wasmxw.getChainId()

            // if leader is not correct, we revert
            leader = getLeaderChain(ext.chain_ids)
            if (leader != ext.leader_chain_id) {
                revert(`atomic transaction wrong leader: expected ${leader}, got ${ext.leader_chain_id}`)
            }

            // forward to other chains too
            const otherchains: string[] = []
            for (let n = 0; n < ext.chain_ids.length; n++) {
                if (ext.chain_ids[n] != ourchain) {
                    otherchains.push(ext.chain_ids[n])
                }
            }
            forwardMsgToOtherChains(transaction, otherchains)

            // this tx is not for our chain, we do not add to mempool
            if (!ext.chain_ids.includes(ourchain)) {
                return txhash;
            }

            // don't propose atomic transactions if we do not have all subchains
            const oursubchains = mcwrap.GetSubChainIds();
            let weCanIncludeInBlock = true;
            atomicChains = ext.chain_ids;
            for (let i = 0; i < ext.chain_ids.length; i++) {
                if (!oursubchains.includes(ext.chain_ids[i])) {
                    weCanIncludeInBlock = false;
                    break;
                }
            }
            if (!weCanIncludeInBlock) {
                LoggerInfo("atomic transaction not added to mempool, node cannot be proposer", ["txhash", txhash, "subchains", ext.chain_ids.join(",")])
                return txhash;
            }
        }
    }

    // check that tx is valid
    // we run CheckTx last, because it persists temporary state between tx checks and if CheckTx passes, but the tx is not included in the mempool,
    // cosmos-sdk still believes the tx has passed, so the account sequence is increased in the temporary context
    const checktx = new typestnd.RequestCheckTx(transaction, typestnd.CheckTxType.New);
    const checkResp = consensuswrap.CheckTx(checktx);
    // we only check the code type; CheckTx should be stateless, just form checking
    if (checkResp.code !== typestnd.CodeType.Ok) {
        // transaction is not valid, we should finish; we use this error to check forwarded txs to leader
        revert(`${cfg.ERROR_INVALID_TX}; code ${checkResp.code}; ${checkResp.log}; txhash: ${txhash}`);
        return "";
    }

    // add to mempool
    mempool.add(txhash, transaction, txGas, leader);
    setMempool(mempool);
    if (leader != "") {
        LoggerInfo("new transaction added to mempool", ["txhash", txhash, "atomic_crosschain_tx_leader", leader, "subchains", atomicChains.join(",")])
    } else {
        LoggerInfo("new transaction added to mempool", ["txhash", txhash])
    }
    return txhash;
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
    let state = getCurrentState()
    if (state.validValue > 0) {
        // we already have this proposal stored
        LoggerDebug(`block proposal already exists`, ["valid_value", state.validValue.toString()])
        return
    }
    if (!nodeInfoComplete()) {
        // reset block proposal
        state.nextHash = "";
        setCurrentState(state);
        return;
    }
    // we propose a new block or overwrite any other past proposal
    // we take the last block signed precommits from the current state
    const lastBlockCommit = getLastBlockCommit(state);
    const result = tnd.proposeBlockInternalAndStore(lastBlockCommit)
    let nextHash = "";
    if (result == null) {
        // we can reuse prevotes signed with the previous round
        // but we must reset the block precommit signatures
        const height = getLastLogIndex()
        const termId = getTermId()
        LoggerDebug(`resetting block commit signatures`, ["height", height.toString(), "termId", termId.toString()])
        resetPrecommitArray(height, termId)
        // we expect getLogEntryObj(height) has been set by tnd.proposeBlockInternalAndStore
        const entry = getLogEntryAggregate(height);
        if (entry != null) {
            const data = decodeBase64(entry.data.data);
            const processReqWithMeta = JSON.parse<typestnd.RequestProcessProposalWithMetaInfo>(String.UTF8.decode(data.buffer));
            nextHash = processReqWithMeta.request.hash
        }
    } else {
        nextHash = result.proposal.hash;
    }

    state = getCurrentState()
    state.nextHash = nextHash;
    setCurrentState(state);
}

export function getLastBlockCommitExternal(): void {
    let state = getCurrentState()
    // we propose a new block or overwrite any other past proposal
    // we take the last block signed precommits from the current state
    let lastBlockCommit = getLastBlockCommit(state);
    if (lastBlockCommit.signatures.length > 0) {
        const validators = getAllValidators();
        // get only active validators & sort by power and address
        const validatorInfos = sortTendermintValidators(getActiveValidatorInfo(validators))
        // sort active validators by power & address
        lastBlockCommit = getSortedBlockCommits(lastBlockCommit, validatorInfos)
        lastBlockCommit = cleanAbsentCommits(lastBlockCommit)
    }

    const resp = String.UTF8.encode(JSON.stringify<typestnd.BlockCommit>(lastBlockCommit))
    wasmx.setFinishData(resp)
}

export function sendBlockProposal(
    params: ActionParam[],
    event: EventObject,
): void {
    if (!weAreNotAlone()) {
        return;
    }
    const state = getCurrentState();
    const data = prepareAppendEntry(state.nextHeight);
    if (data == null) return;

    const msgstr = prepareAppendEntryMessage(data);
    LoggerDebug("sending block proposal", ["height", state.nextHeight.toString()])

    const contract = wasmxw.getAddress();
    const protocolId = getProtocolId(state)
    const topic = getTopic(state, cfg.CHAT_ROOM_BLOCK_PROPOSAL)
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, msgstr, protocolId, topic))
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

    // if chain not started yet, we do not respond.
    if (lastIndex <= cfg.LOG_START) return;

    let trustedBlockHash = ""
    let trustedIndex: i64 = cfg.LOG_START
    if (lastIndex > cfg.TRUST_BLOCK_DELTA) {
        trustedIndex = lastIndex - cfg.TRUST_BLOCK_DELTA
        const trustedBlock = getLogEntryAggregate(trustedIndex)
        if (trustedBlock != null) {
            const trustedProcessReqStr = String.UTF8.decode(decodeBase64(trustedBlock.data.data).buffer);
            const trustedProcessReqWithMeta = JSON.parse<typestnd.RequestProcessProposalWithMetaInfo>(trustedProcessReqStr);
            trustedBlockHash = trustedProcessReqWithMeta.request.hash
        }
    }
    const peers = [resp.peer_address]

    LoggerInfo("received statesync request", ["sender", resp.peer_address, "startIndex", resp.start_index.toString(), "lastIndex", lastIndex.toString()])

    if (lastIndex < resp.start_index) {
        // we nontheless send an empty batch response, because it is used to trigger a node list update
        sendStateSyncBatch(resp.start_index, lastIndex, lastIndex, trustedIndex, trustedBlockHash, termId, peers);
        return;
    };

    // send successive messages with max STATE_SYNC_BATCH blocks at a time
    const count = lastIndex - resp.start_index + 1

    if (count > cfg.MAX_BLOCK_SYNC_DELTA) {
        // the node will need to start state sync
        const state = getCurrentState()
        const protocolId = getProtocolId(state)
        const response = p2pw.StartStateSyncResponse(new p2ptypes.StartStateSyncResRequest(resp.peer_address, protocolId))
        if (response.error.length > 0) {
            LoggerError("failed to start state sync as provider", ["error", response.error]);
        }
        sendStateSyncBatch(resp.start_index, resp.start_index, lastIndex, trustedIndex, trustedBlockHash, termId, peers);
        return
    }

    const batches = i32(Math.ceil(f64(count)/f64(cfg.STATE_SYNC_BATCH)))
    let startIndex = resp.start_index;
    let lastIndexToSend = startIndex;
    for (let i = 0; i < batches - 1; i++) {
        lastIndexToSend = startIndex + cfg.STATE_SYNC_BATCH - 1
        sendStateSyncBatch(startIndex, lastIndexToSend, lastIndex, trustedIndex, trustedBlockHash, termId, peers);
        startIndex += cfg.STATE_SYNC_BATCH
    }
    if (lastIndexToSend <= lastIndex) {
        // last batch
        sendStateSyncBatch(startIndex, lastIndex, lastIndex, trustedIndex, trustedBlockHash, termId, peers);
    }
    LoggerInfo("statesync request processed", ["sender", resp.peer_address, "startIndex", resp.start_index.toString(), "lastIndex", lastIndex.toString(), "batches", batches.toString()])
}

function sendStateSyncBatch(start_index: i64, lastIndexToSend: i64, lastIndex: i64, trustedIndex: i64, trustedHash: Base64String, termId: i32, peers: string[]): void {
    const entries: Array<LogEntryAggregate> = [];
    for (let i = start_index; i <= lastIndexToSend; i++) {
        const entry = getLogEntryAggregate(i);
        if (entry != null) {
            entries.push(entry);
        }
    }

    // we do not sign this message, because the receiver may not have our publicKey

    const nodes = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const peerAddress = raftp2pactions.getP2PAddress(nodes[ourId])

    const response = new StateSyncResponse(start_index, lastIndexToSend, lastIndex, trustedIndex, trustedHash, termId, peerAddress, entries);
    const datastr = JSON.stringify<StateSyncResponse>(response);
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));

    const senderaddr = nodes[ourId].address;
    const msgstr = `{"run":{"event":{"type":"receiveStateSyncResponse","params":[{"key": "entry","value":"${dataBase64}"},{"key": "sender","value":"${senderaddr}"}]}}}`
    LoggerDebug("sending state sync chunk", ["count", response.entries.length.toString(), "from", start_index.toString(), "to", lastIndexToSend.toString(), "last_index", lastIndex.toString()])

    const contract = wasmxw.getAddress();
    const protocolId = getProtocolId(getCurrentState())
    p2pw.SendMessageToPeers(new p2ptypes.SendMessageToPeersRequest(contract, contract, msgstr, protocolId, peers))
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

    const count = resp.last_log_index - resp.start_batch_index + 1
    if (count > cfg.MAX_BLOCK_SYNC_DELTA) {
        LoggerInfo("received statesync response, starting state sync", ["from", resp.start_batch_index.toString(), "to", resp.last_log_index.toString()])
        const protocolId = getProtocolId(getCurrentState())

        // disconnect from other chat rooms, so we do not receive additional messages
        disconnectRooms();

        // TODO all state sync options from tendermint
        // that will be sent to consensus contract during StartNode
        const currentNodeid = getCurrentNodeId();
        const nodeIps = getValidatorNodesInfo();
        const peers: string[] = [];
        for (let i = 0; i < nodeIps.length; i++) {
            peers.push(nodeIps[i].node.ip)
        }

        const response = p2pw.StartStateSyncRequest(new p2ptypes.StartStateSyncReqRequest(lastIndex, resp.trusted_log_index, resp.trusted_log_hash, resp.peer_address, protocolId, peers, currentNodeid))
        if (response.error.length > 0) {
            LoggerError("failed to start state sync as receiver", ["error", response.error]);
        }
        return
    }

    if (lastIndex >= resp.last_batch_index) return;

    let nextIndex = lastIndex+1

    LoggerInfo("received statesync response", ["count", resp.entries.length.toString(), "from", resp.start_batch_index.toString(), "to", resp.last_batch_index.toString(), "last_log_index", resp.last_log_index.toString()])

    // now we check the new block
    for (let i = 0; i < resp.entries.length; i++) {
        const block = resp.entries[i]
        // processAppendEntry(resp.entries[i]);
        const processed = storeNewBlockOutOfOrder(block.termId, block, nextIndex)
        if (processed) {
            startBlockFinalizationFollowerInternal(block);
        }
        nextIndex += 1;
    }
    setTermId(resp.termId);
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

    // verify signature
    const isSender = verifyMessageByAddr(sender, signature, entryStr);
    if (!isSender) {
        LoggerError("signature verification failed for AppendEntry", ["proposerId", entry.proposerId.toString(), "sender", sender, "termId", entry.termId.toString()]);
        return;
    }

    const state = getCurrentState()

    // now we check the new block
    for (let i = 0; i < entry.entries.length; i++) {
        const block = entry.entries[i];
        // don't receive block proposals for already finalized blocks
        if (block.index < state.nextHeight) {
            LoggerInfo("already stored block ... skipping block proposal", ["height", block.index.toString()])
            continue;
        }
        if (block.index > state.nextHeight) {
            // we store the block temporarily;
            LoggerInfo("block stored out of order", ["height", block.index.toString(), "expected", state.nextHeight.toString(), "nextHeight", state.nextHeight.toString()])
            storeNewBlockOutOfOrder(block.termId, block, state.nextHeight)
            continue;
        }

        if (getTermId() > block.termId) {
            // we need to rollback proposer queue and termId
            rollbackTermIdWithStateChange(block.termId, entry.proposerQueue.proposerIndex, entry.proposerQueue.proposerQueue);
        }

        // we only receive block proposals if we are synced
        // if we are not synced, we use Commit messages
        processAppendEntry(block);
        // storeNewBlockOutOfOrder(entry.termId, block, state.nextHeight);
    }
}

// this is where new blocks are processed in order
export function processAppendEntry(entry: LogEntryAggregate): boolean {
    const data = decodeBase64(entry.data.data);
    const processReqWithMeta = JSON.parse<typestnd.RequestProcessProposalWithMetaInfo>(String.UTF8.decode(data.buffer));
    const processReq = processReqWithMeta.request

    const errorStr = tnd.verifyBlockProposal(entry.data, processReq)
    if (errorStr.length > 0) {
        LoggerError("new block rejected", ["height", processReq.height.toString(), "error", errorStr, "header", entry.data.header])
        return false;
    }
    const termId = getTermId();
    LoggerInfo("received new block proposal", [
        "height", processReq.height.toString(),
        "proposerId", entry.leaderId.toString(),
        "termId", entry.termId.toString(),
        "hash", base64ToHex(processReq.hash),
        "our_termId", termId.toString(),
    ]);

    // TODO check all the validator signatures on the previous block, for correctness
    // TODO do we compare with our own signatures?
    // entry.data.last_commit

    const processResp = consensuswrap.ProcessProposal(processReq);
    if (processResp.status === typestnd.ProposalStatus.REJECT) {
        // TODO - what to do here? returning just discards the block and does not return a response to the leader
        // but this node will not sync with the leader anymore
        LoggerError("new block rejected", ["height", processReq.height.toString(), "node type", "Follower"])
        return false;
    }
    appendLogEntry(entry);

    // set hash for the proposal we have accepted
    const state = getCurrentState()
    state.nextHash = processReq.hash
    setCurrentState(state);

    return true;
}

export function setRoundProposer(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId();
    const currentState = getCurrentState();

    // >= ?? (sometimes we update termId from other nodes)
    if (currentState.proposerQueueTermId == termId) return;
    if (currentState.proposerQueueTermId > termId) {
        setTermId(currentState.proposerQueueTermId)
        LoggerDebug("new proposer set from proposer queue", ["validator_index", currentState.proposerIndex.toString(), "termId", currentState.proposerQueueTermId.toString()])
        return;
    }

    // we hope validator composition has not changed
    const validators = getAllValidators();
    const rounds = termId - currentState.proposerQueueTermId;

    for (let i = 0; i < rounds; i++) {
        const resp = getNextProposer(validators, currentState.proposerQueue);
        currentState.proposerIndex = resp.proposerIndex;
        currentState.proposerQueueTermId = termId;
        currentState.proposerQueue = resp.proposerQueue;
    }

    setCurrentState(currentState);
    LoggerDebug("new proposer set", ["validator_index", currentState.proposerIndex.toString(), "termId", currentState.proposerQueueTermId.toString(), "queue", JSON.stringify<ValidatorQueueEntry[]>(currentState.proposerQueue)])
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

export function ifNextBlockProposal(
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
    const resp = isNextBlockProposal(entry)
    return resp;
}

export function isNextBlockProposal(entry: AppendEntry): boolean {
    if (entry.entries.length == 0) return false;
    const block = entry.entries[0]

    const state = getCurrentState()
    if (state.nextHeight != block.index) {
        LoggerDebug("received next block proposal, skipping", ["height", block.index.toString(), "expected_height", state.nextHeight.toString(), "proposerIndex", block.leaderId.toString()])
        return false;
    }

    const validators = getAllValidators();
    const resp = getNextProposer(validators, state.proposerQueue);
    if (resp.proposerIndex == block.leaderId) {
        LoggerInfo("received next block proposal, canceling delay", ["height", block.index.toString(), "proposerIndex", block.leaderId.toString()])
        return true;
    }
    return false;
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
    const termId = getTermId();
    return entry.proposerId == proposerIndex && termId == entry.termId;
}

export function ifForceProposalReset(
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
    const termId = getTermId();
    if (termId == entry.termId &&  entry.proposerId != proposerIndex) return false;

    const state = getCurrentState()
    let forceReset = false;
    // reject heights we do not expect (we have commit messages for this)
    if (entry.entries.length == 0 || entry.entries[0].index != state.nextHeight) {
        return false;
    }
    // if we have a valid block proposal, we reject this
    // lockedValue is set after prevoteAcceptThreshold and reset at commit/new round
    // nextHash is set when we have a block proposal for this round
    if (state.lockedValue > 0 && state.nextHash != "") {
        LoggerInfo("block proposal rejected", ["lockedValue", state.lockedValue.toString(), "nextHash", base64ToHex(state.nextHash), "nextHeight", state.nextHeight.toString(), "entry.termId", entry.termId.toString(), "entry.height", entry.entries[0].index.toString()])
        return false;
    }
    // we can allow receiving block proposals from nodes with a smaller term/round id if we determine we have not finalized blocks for more than 5 rounds.
    if (termId > entry.termId) {
        forceReset = (termId - state.last_round) > 2 || state.last_round == 0;
        rollbackTermIdWithStateChange(entry.termId, entry.proposerQueue.proposerIndex, entry.proposerQueue.proposerQueue)
    } else {
        // termId < entry.termId
        // check last termId with a successful block - we may be  out of sync
        // we consider being out of sync if we have 2 unsuccessful rounds
        // forceReset = (termId - state.last_round) > 2
        forceReset = true // we don't wait, just accept
    }
    if (forceReset) {
        LoggerInfo("block proposal reset", ["termId", termId.toString(), "entry.termId", entry.termId.toString(), "last_round", state.last_round.toString()])
        setTermId(entry.termId);
        return true
    } else {
        LoggerInfo("block proposal rejected", ["termId", termId.toString(), "entry.termId", entry.termId.toString(), "last_round", state.last_round.toString(), "reset", forceReset.toString()])
    }
    return false
}

function rollbackTermIdWithStateChange(termId: i64, proposerIndex: i32, proposerQueue: ValidatorQueueEntry[]): void {
    LoggerInfo("rolling back term_id", ["previous", getTermId().toString(), "new", termId.toString()])
    const state = getCurrentState()
    // we neet to rollback proposer queue
    state.proposerQueueTermId = termId;
    state.proposerIndex =  proposerIndex;
    state.proposerQueue = proposerQueue;
    setCurrentState(state);
    setTermId(termId);
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
    let state = getCurrentState();
    if (state.nextHash == "") {
        return
    }
    const nodeIps = getValidatorNodesInfo();
    if (!nodeInfoCompleteInternal(nodeIps)) {
        return;
    }

    // get the current proposal & vote on the block hash
    const data = buildPrevoteMessage();

    addToPrevoteArray(getCurrentNodeId(), data);

    if (!weAreNotAloneInternal(nodeIps)) {
        return;
    }

    const msgstr = preparePrevoteMessage(data);
    LoggerDebug("sending prevote", ["index", data.index.toString(), "hash", data.hash, "term_id", data.termId.toString()])

    const contract = wasmxw.getAddress();
    state = getCurrentState()
    const protocolId = getProtocolId(state)
    const topic = getTopic(state, cfg.CHAT_ROOM_PREVOTE)
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, msgstr, protocolId, topic))
}

export function sendPrevoteNil(
    params: ActionParam[],
    event: EventObject,
): void {
    const nodeIps = getValidatorNodesInfo();
    if (!nodeInfoCompleteInternal(nodeIps)) {
        return;
    }

    const termId = getTermId()
    const state = getCurrentState()
    const nextIndex = state.nextHeight;
    const ourId = getCurrentNodeId();
    const getOurInfo = nodeIps[ourId];

    // const vaddr = wasmxw.addr_humanize(decodeBase64(state.validator_pubkey).buffer)
    const consAddr = getOurInfo.address
    const data = new ValidatorProposalVote(SignedMsgType.SIGNED_MSG_TYPE_PREVOTE, termId, consAddr, ourId, nextIndex, "nil", new Date(Date.now()), state.chain_id)

    addToPrevoteArray(getCurrentNodeId(), data);

    if (!weAreNotAloneInternal(nodeIps)) {
        return;
    }

    const msgstr = preparePrevoteMessage(data);
    LoggerDebug("sending prevote", ["index", data.index.toString(), "term_id", data.termId.toString(), "hash", "nil"])

    const contract = wasmxw.getAddress();
    const protocolId = getProtocolId(state)
    const topic = getTopic(state, cfg.CHAT_ROOM_PREVOTE)
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, msgstr, protocolId, topic))
}

export function buildPrevoteMessage(): ValidatorProposalVote {
    const nodeIps = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const nodeInfo = nodeIps[ourId];
    const state = getCurrentState();
    const vaddr = wasmxw.addr_humanize(decodeBase64(state.validator_pubkey).buffer)
    const consAddr = nodeInfo.address
     // TODO chainId
    return new ValidatorProposalVote(SignedMsgType.SIGNED_MSG_TYPE_PREVOTE, getTermId(), consAddr, ourId, state.nextHeight, state.nextHash, new Date(Date.now()), state.chain_id);
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
    if (getCurrentState().nextHash == "") {
        return
    }
    if (!nodeInfoComplete()) {
        return;
    }

    // get the current proposal & vote on the block hash
    const data = buildPrecommitMessage();
    const resp = preparePrecommitMessage(data);
    const msgstr = resp[0]
    const signature = resp[1]
    LoggerDebug("sending precommit", ["index", data.index.toString(), "hash", data.hash, "term_id", data.termId.toString()])

    const precommit = new ValidatorCommitVote(data, typestnd.BlockIDFlag.Commit, signature)
    addToPrecommitArray(getCurrentNodeId(), precommit)

    if (!weAreNotAlone()) {
        return;
    }

    const contract = wasmxw.getAddress();
    const state = getCurrentState()
    const protocolId = getProtocolId(state)
    const topic = getTopic(state, cfg.CHAT_ROOM_PRECOMMIT)
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, msgstr, protocolId, topic))
}

export function sendPrecommitNil(
    params: ActionParam[],
    event: EventObject,
): void {
    const nodeIps = getValidatorNodesInfo();
    if (!nodeInfoCompleteInternal(nodeIps)) {
        return;
    }

    const termId = getTermId()
    const state = getCurrentState()
    const nextIndex = state.nextHeight;
    const ourId = getCurrentNodeId();
    const getOurInfo = nodeIps[ourId];
    const vaddr = wasmxw.addr_humanize(decodeBase64(state.validator_pubkey).buffer)
    const consAddr = getOurInfo.address
    // TODO chainId
    const data = new ValidatorProposalVote(SignedMsgType.SIGNED_MSG_TYPE_PRECOMMIT, termId, consAddr, ourId, nextIndex, "nil", new Date(Date.now()), state.chain_id)

    const resp = preparePrecommitMessage(data);
    const msgstr = resp[0]
    const signature = resp[1]
    LoggerDebug("sending precommit", ["index", data.index.toString(), "term_id", data.termId.toString(), "hash", "nil"])

    const precommit = new ValidatorCommitVote(data, typestnd.BlockIDFlag.Nil, signature)
    addToPrecommitArray(getCurrentNodeId(), precommit)

    if (!weAreNotAlone()) {
        return;
    }

    const contract = wasmxw.getAddress();
    const protocolId = getProtocolId(state)
    const topic = getTopic(state, cfg.CHAT_ROOM_PREVOTE)
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, msgstr, protocolId, topic))
}

export function buildPrecommitMessage(): ValidatorProposalVote {
    const nodeIps = getValidatorNodesInfo();
    const ourId = getCurrentNodeId();
    const nodeInfo = nodeIps[ourId];
    const state = getCurrentState();
    const vaddr = wasmxw.addr_humanize(decodeBase64(state.validator_pubkey).buffer)
    const consAddr = nodeInfo.address
    // TODO chainId
    return new ValidatorProposalVote(SignedMsgType.SIGNED_MSG_TYPE_PRECOMMIT, getTermId(), consAddr, ourId, state.nextHeight, state.nextHash, new Date(Date.now()), state.chain_id);
}

export function preparePrecommitMessage(data: ValidatorProposalVote): string[] {
    const datastr = JSON.stringify<ValidatorProposalVote>(data);
    const commit = getTendermintVote(data);
    const bz = consensuswrap.BlockCommitVoteBytes(commit)
    const signature = tnd.signMessageBytes(bz);
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
    if (state.chain_id != data.chainId) return;
    if (state.nextHeight != data.index) return;

    // verify signature
    const isSender = verifyMessageByAddr(data.validatorAddress, signature, datastr);
    if (!isSender) {
        LoggerError("signature verification failed for prevote", ["sender", data.validatorAddress]);
        return;
    }

    // we add the prevote to the arrays
    const nodes = getValidatorNodesInfo();
    const nodeIndex = getNodeIdByAddress(data.validatorAddress, nodes);
    if (nodeIndex == -1) {
        LoggerError("prevote sender node not found", ["sender", data.validatorAddress]);
        return;
    }
    addToPrevoteArray(nodeIndex, data);
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

    const state = getCurrentState();
    LoggerDebug("precommit received", ["sender", data.validatorAddress, "index", data.index.toString(), "hash", data.hash, "termId", data.termId.toString(), "timestamp", data.timestamp.toISOString(), "accepted", (state.nextHeight == data.index).toString()])
    if (state.chain_id != data.chainId) return;
    if (state.nextHeight != data.index) return;

    // verify signature
    const commit = getTendermintVote(data);
    const bz = consensuswrap.BlockCommitVoteBytes(commit)
    const isSender = verifyMessageBytesByAddr(data.validatorAddress, signature, bz);
    if (!isSender) {
        LoggerError("signature verification failed for precommit", ["sender", data.validatorAddress]);
        return;
    }

    // we add the precommit to the arrays
    // const precommitArr = getPrecommitArray();
    const nodes = getValidatorNodesInfo();
    const nodeIndex = getNodeIdByAddress(data.validatorAddress, nodes);
    if (nodeIndex == -1) {
        LoggerError("precommit sender node not found", ["sender", data.validatorAddress]);
        return;
    }

    let blockIdFlag = typestnd.BlockIDFlag.Nil
    if (data.hash != "" && data.hash != "nil") {
        blockIdFlag = typestnd.BlockIDFlag.Commit
    }
    const precommit = new ValidatorCommitVote(data, blockIdFlag, signature)
    addToPrecommitArray(nodeIndex, precommit)
}

export function ifPrevoteAnyThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const state = getCurrentState()
    // if a block was never proposed (proposer offline or out of sync)
    // we do not proceed to precommit
    if (state.nextHash == "") {
        return false;
    }
    return isPrevoteAnyThreshold(state.nextHeight, state.nextHash);
}

export function ifPrevoteAcceptThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const state = getCurrentState()
    // if a block was never proposed (proposer offline or out of sync)
    // we do not proceed to precommit
    if (state.nextHash == "") {
        return false;
    }
    return isPrevoteAcceptThreshold(state.nextHeight, state.nextHash);
}

export function ifPrecommitAnyThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const state = getCurrentState()
    // if a block was never proposed (proposer offline or out of sync)
    // we do not proceed to precommit
    if (state.nextHash == "") {
        return false;
    }
    return isPrecommitAnyThreshold(state.nextHeight, state.nextHash);
}

export function ifPrecommitAcceptThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const state = getCurrentState()
    // if a block was never proposed (proposer offline or out of sync)
    // we do not proceed to commit
    // this should never happen, this is caught at prevote
    if (state.nextHash == "") {
        return false;
    }
    return isPrecommitAcceptThreshold(state.nextHeight, state.nextHash);
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
        startBlockFinalizationFollower(state.nextHeight);
    }
}

export function resetPrevotes(
    params: ActionParam[],
    event: EventObject,
): void {
    const validators = getAllValidatorInfos();
    const count = validators.length;
    const state = getCurrentState();
    const nextIndex = state.nextHeight;
    const termId = getTermId()

    const map = getPrevoteArrayMap()
    // remove finalized blocks
    map.removeLowerHeights(nextIndex - 1);
    if (map.nodeCount < count) {
        // increase array sizes for all heights
        map.resize(validators)
    }
    // we may receive prevotes before this time, so an entry may already be created
    // prevotes for old termIds are not removed now
    if (!map.map.has(nextIndex)) {
        const emptyarr = getEmptyValidatorProposalVoteArray(count, nextIndex, termId, SignedMsgType.SIGNED_MSG_TYPE_PREVOTE);
        // we need to store the validator address
        for (let i = 0 ; i < emptyarr.length; i++) {
            emptyarr[i].validatorAddress = validators[i].operator_address;
        }
        map.map.set(nextIndex, emptyarr)
    }
    setPrevoteArrayMap(map);

    // TODO this should be in the state diagram...
    // we reset locked value; locked means it is in voting process
    state.lockedRound = 0;
    state.lockedValue = 0;
    setCurrentState(state);
}

export function resetPrecommits(
    params: ActionParam[],
    event: EventObject,
): void {
    // TODO all validators, only bonded validators???
    const validators = getAllValidatorInfos();
    const count = validators.length;
    const state = getCurrentState();
    const nextIndex = state.nextHeight;

    const map = getPrecommitArrayMap()
    // remove finalized blocks
    map.removeLowerHeights(nextIndex - 1);
    if (map.nodeCount < count) {
        // increase array sizes for all heights
        map.resize(validators)
    }
    // we may receive precommits before this time, so an entry may already be created
    if (!map.map.has(nextIndex)) {
        const termId = getTermId()
        const emptyarr = getEmptyPrecommitArray(count, nextIndex, termId, SignedMsgType.SIGNED_MSG_TYPE_PRECOMMIT);
        // we need to store the validator address
        for (let i = 0 ; i < emptyarr.length; i++) {
            emptyarr[i].vote.validatorAddress = validators[i].operator_address;
        }
        map.map.set(nextIndex, emptyarr)
    }
    setPrecommitArrayMap(map);
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

export function buildCommitMessage(): Commit | null {
    const state = getCurrentState();
    const termId = getTermId();

    // this is after commitBlock!!, where we increment the block height
    const index = state.nextHeight - 1;
    // before resetValidValue!
    const hash = state.nextHash
    const entry = getLogEntryAggregate(index)
    if (entry == null) {
        return null
    }
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
    if (data == null) return;
    const datastr = JSON.stringify<Commit>(data);
    const dataBase64 = stringToBase64(datastr);
    const msgstr = `{"run":{"event":{"type":"receiveCommit","params":[{"key": "entry","value":"${dataBase64}"}]}}}`

    LoggerDebug("sending commit", ["index", data.index.toString(), "hash", data.hash])

    const contract = wasmxw.getAddress();
    const state = getCurrentState()
    const protocolId = getProtocolId(state)
    const topic = getTopic(state, cfg.CHAT_ROOM_PROTOCOL)
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, msgstr, protocolId, topic))
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
}

// currentState.nextHeight
export function storeNewBlockOutOfOrder(blockTermId: i64, block: LogEntryAggregate, nextHeight: i64): boolean {
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
        return processAppendEntry(block);
    }
    return false;
}

export function signMessageExternal(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("message")) {
        revert("no message found");
    }
    const msgstr = ctx.get("message") // stringified message

    const currentState = getCurrentState();
    const msgBase64 = Uint8Array.wrap(String.UTF8.encode(msgstr));
    const privKey = base64.decode(currentState.validator_privkey);
    const signature = wasmx.ed25519Sign(privKey.buffer, msgBase64.buffer);
    const signatureBase64 = base64.encode(Uint8Array.wrap(signature));
    LoggerDebug("ed25519Sign", ["signature", signatureBase64])
    wasmx.setFinishData(signature)
}
