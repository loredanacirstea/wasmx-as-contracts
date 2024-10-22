import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as roles from "wasmx-env/assembly/roles"
import {
  Base64String,
  Bech32String,
  CallRequest,
  CallResponse,
  HexString,
  SignedTransaction,
} from 'wasmx-env/assembly/types';
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as staking from "wasmx-stake/assembly/types";
import { CurrentState, Mempool, MempoolTx } from "./types_blockchain";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { parseInt32, parseInt64, uint8ArrayToHex, parseUint8ArrayToU32BigEndian, base64ToHex, stringToBase64, base64ToString } from "wasmx-utils/assembly/utils";
import { extractUpdateNodeEntryAndVerify, registeredCheckMessage, registeredCheckNeeded, removeNode } from "wasmx-raft/assembly/actions";
import { LogEntryAggregate, AppendEntry, AppendEntryResponse, Precommit, MODULE_NAME, BuildProposal } from "./types";
import * as cfg from "./config";
import { LoggerDebug, LoggerInfo, LoggerError, revert, LoggerDebugExtended } from "./utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { cleanAbsentCommits, extractIndexedTopics, getActiveValidatorInfo, getCommitHash, getConsensusParamsHash, getEvidenceHash, getHeaderHash, getResultsHash, getSortedBlockCommits, getTxsHash, getValidatorsHash, sortTendermintValidators } from "wasmx-consensus-utils/assembly/utils"
import { getLeaderChain } from "wasmx-consensus/assembly/multichain_utils";
import { appendLogEntry, decodeTx, getBlockID, getCurrentNodeId, getCurrentState, getLastLogIndex, getLogEntryObj, getNextIndexArray, getNodeCount, getNodeIPs, getTermId, removeLogEntry, setCurrentState, setLastLogIndex, setLogEntryAggregate, setLogEntryObj, setNextIndexArray, setNodeIPs, setTermId } from "./action_utils";
import { NodeUpdate, UpdateNodeResponse } from "wasmx-raft/assembly/types_raft";
import { verifyMessage } from "wasmx-raft/assembly/action_utils";
import { NetworkNode, NodeInfo } from "wasmx-p2p/assembly/types";

// guards

export function isNextProposer(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const currentState = getCurrentState();
    const validators = getAllValidators();
    if (validators.length == 1) {
        const nodes = getNodeIPs();
        if (nodes.length > validators.length) {
            LoggerInfo("cannot propose block, state is not synced", ["validators", validators.length.toString(), "nodes", nodes.length.toString()])
            return false;
        }
    }
    console.debug("* isNextProposer validators: " + validators.length.toString())
    const totalStaked = getTotalStaked(validators);
    LoggerDebug("isNextProposer", ["total staked", totalStaked.toString()])
    const proposerIndex = getNextProposer(currentState.last_block_id.hash, totalStaked, validators);
    LoggerDebug("isNextProposer", ["next proposer", proposerIndex.toString()])
    const currentNode = getCurrentNodeId();
    return proposerIndex == currentNode;
}

export function ifNewTransaction(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("transaction")) {
        revert("no transaction found");
    }
    const transaction = ctx.get("transaction") // base64
    const txhash = wasmxw.sha256(transaction);
    const mempool = getMempool();
    const existent = mempool.map.has(txhash) || mempool.temp.has(txhash);
    if (existent) {
        LoggerDebug("mempool: transaction already added or seen", ["txhash", txhash])
    }
    return !existent;
}

export function ifPrevoteThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return false;
}

export function ifPrecommitThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return false;
}

// actions

export function sendPrevoteResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    wasmx.finish(new ArrayBuffer(0));
}

export function proposeBlock(
    params: ActionParam[],
    event: EventObject,
): void {
    const height = getLastLogIndex();
    const currentState = getCurrentState();
    const lastBlockCommit = new typestnd.BlockCommit(height, 0, currentState.last_block_id, []); // TODO
    proposeBlockInternalAndStore(lastBlockCommit);
}

export function proposeBlockInternalAndStore(lastBlockCommit: typestnd.BlockCommit): BuildProposal | null {
    // if last block is not commited, we return; Cosmos SDK can only commit one block at a time.
    const height = getLastLogIndex();
    const lastCommitIndex = getLastBlockIndex();
    if (lastCommitIndex < height) {
        // if we are at a new term and previous proposal was not committed,
        // we update the termId & proposer on the proposal
        // and we will reuse it in this term
        // LoggerInfo("cannot propose new block, last block not commited", ["height", height.toString(), "lastCommitIndex", lastCommitIndex.toString(), "termId", getTermId().toString()])

        const entry = getLogEntryObj(height);
        entry.termId = getTermId()
        entry.leaderId = getCurrentNodeId()
        setLogEntryObj(entry);

        LoggerInfo("reuse previous term block proposal", ["height", height.toString(), "lastCommitIndex", lastCommitIndex.toString(), "termId", getTermId().toString()])
        // after we get a null return, we must reset the block commit signatures
        return null;
    }

    const mempool = getMempool();
    const cparams = getConsensusParams(0);
    let maxbytes = cparams.block.max_bytes;
    if (maxbytes == -1) {
        maxbytes = cfg.MaxBlockSizeBytes;
    }
    const batch = mempool.batch(cparams.block.max_gas, maxbytes, getCurrentState().chain_id);
    LoggerDebug("mempool: batch transactions", ["count", batch.txs.length.toString(), "total", mempool.map.keys().length.toString()])

    // TODO
    // maxDataBytes := types.MaxDataBytes(maxBytes, evSize, state.Validators.Size())
    const maxDataBytes = maxbytes;

    // start proposal protocol
    const result = buildBlockProposal(batch.txs, batch.isAtomicTx, batch.cummulatedGas, maxDataBytes, lastBlockCommit);
    if (result == null) {
        const state = getCurrentState()
        state.nextHash = "";
        setCurrentState(state);
        return null;
    }

    // we just save this as a temporary block
    const lastIndex = getLastLogIndex();
    if (lastIndex < result.proposal.height) {
        appendLogEntry(result.entry);
    } else {
        // we overwrite
        setLogEntryAggregate(result.entry);
    }

    setMempool(mempool);
    return result;
}

export function precommitState(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function commit(
    params: ActionParam[],
    event: EventObject,
): void {
    checkCommits();
}

export function incrementCurrentTerm(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId();
    setTermId(termId + 1);
    LoggerInfo("incrementCurrentTerm", ["newterm", (termId + 1).toString()])
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

    // !! nodeIps must be the same for all nodes

    // TODO ID@host:ip
    // 6efc12ab37fc0e096d8618872f6930df53972879@0.0.0.0:26757

    const datajson = String.UTF8.decode(decodeBase64(initChainSetup).buffer);
    // TODO remove validator private key from logs in initChainSetup
    LoggerDebug("setupNode", ["initChainSetup", datajson])
    const data = JSON.parse<typestnd.InitChainSetup>(datajson);
    // const ips = JSON.parse<string[]>(nodeIPs);
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

export function registeredCheck(
    params: ActionParam[],
    event: EventObject,
): void {
    // when a node starts, it needs to add itself to the pack
    // we just need [ourIP, leaderIP]

    const ips = getNodeIPs();
    const needed = registeredCheckNeeded(ips);
    if (!needed) return;

    // send updateNode to all ips except us
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

// TODO only receive block proposal from expected proposer
export function processBlock(
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
    LoggerDebugExtended("received new block proposal", ["block", entryStr]);

    let entry: AppendEntry = JSON.parse<AppendEntry>(entryStr);

    // TODO only accept proposal from expected proposer
    // verify signature
    const isSender = verifyMessage(entry.proposerId, signature, entryStr);
    if (!isSender) {
        LoggerError("signature verification failed for AppendEntry", ["proposerId", entry.proposerId.toString(), "termId", entry.termId.toString()]);
        return;
    }

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
    // const lastCommitIndex = getLastBlockIndex();
    // const lastLogIndex = getLastLogIndex();
    // const maxCommitIndex = i64(Math.min(f64(lastLogIndex), f64(entry.leaderCommit)));
    // for (let i = lastCommitIndex + 1; i <= maxCommitIndex; i++) {
    //     startBlockFinalizationFollower(i);
    // }

    // now we check the new block
    for (let i = 0; i < entry.entries.length; i++) {
        processAppendEntry(entry.entries[i]);
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
    const txhash = addTransactionToMempool(transaction)
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

export function isNodeActive(node: NodeInfo): bool {
    return !node.outofsync && (node.node.ip != "" || node.node.host != "")
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
    const data = new AppendEntry(
        getTermId(),
        getCurrentNodeId(),
        entries,
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
    const msgstr = `{"run":{"event":{"type":"receiveProposal","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`

    LoggerDebug("diseminate blocks...", ["nodeId", nodeId.toString(), "receiver", node.address, "count", data.entries.length.toString(), "from", nextIndex.toString(), "to", lastIndex.toString()])
    return msgstr
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
    const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));
    // we send the request to the same contract
    const contract = wasmx.getAddress();
    const response = wasmxw.grpcRequest(node.node.ip, Uint8Array.wrap(contract), msgBase64);
    if (response.error.length > 0) {
        LoggerError("precommit failed", ["nodeId", nodeId.toString(), "address", node.address, "nodeIp", node.node.ip])
    }
}

export function addTransactionToMempool(
    transaction: Base64String,
): string {
    const txhash = wasmxw.sha256(transaction);
    const mempool = getMempool();
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
    for (let i = 0; i < extopts.length; i++) {
        const extany = extopts[i]
        if (extany.type_url == typestnd.TypeUrl_ExtensionOptionAtomicMultiChainTx) {
            const ext = typestnd.ExtensionOptionAtomicMultiChainTx.fromAnyWrap(extany)
            const ourchain = getCurrentState().chain_id;
            if (!ext.chain_ids.includes(ourchain)) {
                // this tx is not for our chain, we do not add to mempool
                // but we will continue, so it is forwarded to other nodes
                return txhash;
            }
            leader = getLeaderChain(ext.chain_ids)
            if (leader != ext.leader_chain_id) {
                revert(`atomic transaction wrong leader: expected ${leader}, got ${ext.leader_chain_id}`)
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
        revert(`${cfg.ERROR_INVALID_TX}; code ${checkResp.code}; ${checkResp.log}`);
        return "";
    }

    // add to mempool
    mempool.add(txhash, transaction, txGas, leader);
    setMempool(mempool);
    if (leader != "") {
        LoggerInfo("new transaction added to mempool", ["txhash", txhash, "atomic_crosschain_tx_leader", leader, "subchains"])
    } else {
        LoggerInfo("new transaction added to mempool", ["txhash", txhash])
    }
    return txhash;
}

export function sendNewTransactionResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    wasmx.setFinishData(new ArrayBuffer(0));
}

export function sendProposalResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const entry = extractAppendEntry(params, event)
    const response = sendProposalResponseMessage(entry)
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

export function sendProposalResponseMessage(entry: AppendEntry): AppendEntryResponse {
    const termId = getTermId();
    const lastLogIndex = getLastLogIndex();
    let successful = true;
    if (entry.entries.length > 0 && entry.entries[0].index > lastLogIndex) {
        successful = false;
    }
    const response = new AppendEntryResponse(termId, successful, lastLogIndex);
    LoggerDebug("send proposal response", ["termId", termId.toString(), "success", "true"])
    return response
}

export function updateNodeAndReturn(
    params: ActionParam[],
    event: EventObject,
): void {
    let entry = extractUpdateNodeEntryAndVerify(params, event);
    const response = updateNodeEntry(entry);
    wasmx.setFinishData(String.UTF8.encode(JSON.stringify<UpdateNodeResponse>(response)));
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
        nextIndexes.push(cfg.LOG_START + 1);
        setNextIndexArray(nextIndexes);
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

export function sendPrecommitResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    LoggerDebug("send precommit response", ["success", "true"])
    wasmx.setFinishData(new ArrayBuffer(0));
}

// this actually commits one block at a time
export function commitBlocks(
    params: ActionParam[],
    event: EventObject,
): void {
    checkCommits();
}

// this actually commits one block at a time
export function commitBlock(
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
        revert("update node: empty entry");
    }
    if (signature === "") {
        revert("update node: empty signature");
    }
    const entryStr = String.UTF8.decode(decodeBase64(entryBase64).buffer);
    LoggerDebugExtended("received precommit", ["Precommit", entryStr]);

    let entry: Precommit = JSON.parse<Precommit>(entryStr);
    LoggerInfo("received precommit", [
        "proposerId", entry.proposerId.toString(),
        "termId", entry.termId.toString(),
        "height", entry.index.toString(),
    ]);

    // verify signature
    const isSender = verifyMessage(entry.proposerId, signature, entryStr);
    if (!isSender) {
        LoggerError("signature verification failed for AppendEntry", ["proposerId", entry.proposerId.toString(), "termId", entry.termId.toString()]);
        return;
    }

    startBlockFinalizationFollower(entry.index);
}

// utils

export function processAppendEntry(entry: LogEntryAggregate): void {
    const data = decodeBase64(entry.data.data);
    const processReqWithMeta = JSON.parse<typestnd.RequestProcessProposalWithMetaInfo>(String.UTF8.decode(data.buffer));
    const processReq = processReqWithMeta.request

    const errorStr = verifyBlockProposal(entry.data, processReq)
    if (errorStr.length > 0) {
        LoggerError("new block rejected", ["height", processReq.height.toString(), "error", errorStr, "header", entry.data.header])
        return;
    }

    LoggerInfo("received new block proposal", [
        "height", processReq.height.toString(),
        "proposerId", entry.leaderId.toString(),
        "termId", entry.termId.toString(),
        "hash", processReq.hash,
    ]);
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

    // after we set last log index
    initializeIndexArrays(nodeIps.length);

    // TODO we run the hooks that must be ran after block end
    const blockData = getFinalBlock(getLastBlockIndex())
    callHookContract("EndBlock", blockData);
}

function setCurrentNodeId(index: i32): void {
    fsm.setContextValue(cfg.CURRENT_NODE_ID, index.toString());
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
        new Date(0).toISOString(),
        req.validator_address,
        req.validator_privkey,
        req.validator_pubkey,
        cfg.LOG_START + 1, "", 0, 0, 0, 0,
        [], 0, 0,
    );

    const valuestr = JSON.stringify<CurrentState>(currentState);
    LoggerDebug("set current state", ["state", valuestr])
    setCurrentState(currentState);
    setConsensusParams(cfg.LOG_START + 1, req.consensus_params);
    LoggerDebug("current state set", [])
}

function checkValidatorsUpdate(validators: typestnd.ValidatorInfo[], validatorInfo: typestnd.ValidatorInfo, nodeId: i32): void {
    if (validators[nodeId].address != validatorInfo.address) {
        LoggerError("register node response has wrong validator address", ["expected", validatorInfo.address]);
        revert(`register node response has wrong validator address`)
    }
    if (validators[nodeId].pub_key != validatorInfo.pub_key) {
        LoggerError("register node response has wrong validator pub_key", ["expected", validatorInfo.pub_key]);
        revert(`register node response has wrong validator pub_key`)
    }
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

export function initializeIndexArrays(len: i32): void {
    const lastLogIndex = getLastLogIndex()
    const nextIndex: Array<i64> = [];
    const matchIndex: Array<i64> = [];
    for (let i = 0; i < len; i++) {
        // for each server, index of the next log entry to send to that server (initialized to leader's last log index + 1)
        nextIndex[i] = lastLogIndex + 1;
        // for each server, index of highest log entry known to be replicated on server (initialized to 0, increases monotonically)
        matchIndex[i] = cfg.LOG_START; // TODO ?
    }
    setNextIndexArray(nextIndex);
    setMatchIndexArray(matchIndex);
}

function setMatchIndexArray(value: Array<i64>): void {
    fsm.setContextValue(cfg.MATCH_INDEX_ARRAY, JSON.stringify<Array<i64>>(value));
}

// this gets called each reentry in Leader.active state
export function checkCommits(): void {
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

export function readyToCommit(): i64 {
    const lastCommitIndex = getLastBlockIndex();
    // all commited + uncommited logs
    const lastLogIndex = getLastLogIndex();
    const nextIndexPerNode = getNextIndexArray();
    const validators = getAllValidators();
    const len = getNodeCount();
    const nodeId = getCurrentNodeId();
    let nextCommit = lastCommitIndex + 1;

    LoggerDebug("trying to commit next block...", ["lastCommitIndex", lastCommitIndex.toString(), "lastSaved", lastLogIndex.toString(), "blocksToCommit", (lastLogIndex >= nextCommit).toString()])

    if (lastLogIndex < nextCommit) {
        return 0;
    }
    let totalStake = getTotalStaked(validators)
    const threshold = getBFTThreshold(totalStake);
    // calculate voting stake for the proposed block
    let count: BigInt = validators[nodeId].tokens;
    for (let i = 0; i < len; i++) {
        // next index is the next index to send, so we use >
        if (nextIndexPerNode.at(i) > nextCommit) {
            // @ts-ignore
            count += validators[i].tokens;
        }
    }
    // @ts-ignore
    const committing = count >= threshold;
    LoggerDebug("trying to commit next block...", ["height", nextCommit.toString(), "nodes_count", len.toString(), "voting power", count.toString(), "threshold voting power", threshold.toString(), "committing", committing.toString()])

    if(committing) return nextCommit;
    return 0;
}

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

export function getNextProposer(blockHash: Base64String, totalStaked: BigInt, validators: staking.Validator[]): i32 {
    console.debug("-getNextProposer: " + blockHash)
    const hashbz = decodeBase64(blockHash);
    console.debug("-getNextProposer hashbz: " + hashbz.toString())
    const normalizer = Math.pow(2, 32);
    console.debug("-getNextProposer normalizer: " + normalizer.toString())
    const hashslice = Uint8Array.wrap(hashbz.buffer, 0, 4)
    const part = parseUint8ArrayToU32BigEndian(hashslice)
    console.debug("-getNextProposer part: " + part.toString())
    // @ts-ignore
    const totalPower: u64 = (totalStaked / BigInt.fromU64(cfg.STAKE_REDUCTION)).toU64();
    const valf = f64(part) / f64(normalizer) * f64(totalPower);
    const val = u64(valf);
    LoggerDebug("getNextProposer", ["hashslice", uint8ArrayToHex(hashslice), "part", part.toString(), "ratio", (f64(part) / f64(normalizer)).toString(), "val_f64", valf.toString(), "val", val.toString()])
    let closestVal: i32 = -1;
    let aggregatedVP: u64[] = new Array<u64>(validators.length);
    let lastSumVP: u64 = 0;
    for (let i = 0; i < validators.length; i++) {
        const pow: u64 = (validators[i].tokens.div(BigInt.fromU64(cfg.STAKE_REDUCTION))).toU64();
        aggregatedVP[i] = pow + lastSumVP;
        lastSumVP = aggregatedVP[i];
        LoggerDebug("getNextProposer", ["i", i.toString(), "aggregatedVP", aggregatedVP[i].toString(), "aggregatedVP[i] >= val", (aggregatedVP[i] >= val).toString(), ])
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

export function buildBlockProposal(txs: string[], optimisticExecution: boolean, cummulatedGas: i64, maxDataBytes: i64, lastBlockCommit: typestnd.BlockCommit): BuildProposal | null {
    // PrepareProposal TODO finish
    const height = getLastLogIndex() + 1;
    const termId = getTermId()
    LoggerDebug("start block proposal", ["height", height.toString(), "termId", termId.toString()])

    const currentState = getCurrentState();
    const validators = getAllValidators();
    // get only active validators & sort by power and address
    const validatorInfos = sortTendermintValidators(getActiveValidatorInfo(validators))
    const validatorSet = new typestnd.TendermintValidators(validatorInfos)

    // we get the previous block validators for the last block commit signatures
    const previousBlock = getLogEntryAggregate(height - 1);
    let previousValidatorSet: typestnd.TendermintValidators;
    if (previousBlock != null) {
        previousValidatorSet = JSON.parse<typestnd.TendermintValidators>(base64ToString(previousBlock.data.validator_info))
    } else {
        previousValidatorSet = validatorSet;
    }

    // we skip if the validator does not have the commit signatures for the previous block (unless this is the first block under consensus)
    if (lastBlockCommit.signatures.length == 0 && height > (cfg.LOG_START+1)) {
        LoggerDebug("no commit signatures found for previous block ... skipping block proposal", ["height", height.toString()])
        return null;
    }

    if (lastBlockCommit.signatures.length > previousValidatorSet.validators.length) {
        revert(`last block validator set smaller than signature list: expected ${lastBlockCommit.signatures.length}, got ${previousValidatorSet.validators.length}`)
    }

    const lastCommit = new typestnd.CommitInfo(lastBlockCommit.round, []); // TODO for the last block
    const localLastCommit = new typestnd.ExtendedCommitInfo(lastBlockCommit.round, []);
    for (let i = 0; i < lastBlockCommit.signatures.length; i++) {
        const commitSig = lastBlockCommit.signatures[i]
        const val = previousValidatorSet.validators[i]

        // TODO VoteInfo should be hex
        // but then we need a mapping hex => pubkey or hex => operator_address

        // hex format -> bytes -> base64

        // commitSig.validator_address
        const vaddress = encodeBase64(Uint8Array.wrap(wasmxw.addr_canonicalize(val.operator_address)))

        const validator = new typestnd.Validator(vaddress, val.voting_power)
        const voteInfo = new typestnd.VoteInfo(validator, commitSig.block_id_flag)
        lastCommit.votes.push(voteInfo)

        const extendedVoteInfo = new typestnd.ExtendedVoteInfo(validator, "", "", commitSig.block_id_flag)
        localLastCommit.votes.push(extendedVoteInfo)
    }

    let sortedBlockCommits = lastBlockCommit
    // for height = 2, we have no signatures
    if (height > (cfg.LOG_START + 1)) {
        // sort active validators by power & address
        sortedBlockCommits = getSortedBlockCommits(lastBlockCommit, previousValidatorSet.validators)
        sortedBlockCommits = cleanAbsentCommits(sortedBlockCommits)
    }

    const evidence = new typestnd.Evidence(); // TODO

    // TODO next validators hash?
    // TODO use only active validators?
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

    // TODO load app version from storage or Info()?

    const header = new typestnd.Header(
        new typestnd.VersionConsensus(typestnd.BlockProtocol, currentState.version.consensus.app),
        currentState.chain_id,
        prepareReq.height,
        prepareReq.time,
        currentState.last_block_id,
        base64ToHex(getCommitHash(sortedBlockCommits)), // last_commit_hash
        base64ToHex(getTxsHash(prepareResp.txs)), // data_hash
        base64ToHex(nextValidatorsHash), // validators_hash
        base64ToHex(nextValidatorsHash), // next_validators_hash
        base64ToHex(getConsensusParamsHash(getConsensusParams(prepareReq.height))), // consensus_hash
        base64ToHex(currentState.app_hash),
        base64ToHex(currentState.last_results_hash),
        base64ToHex(getEvidenceHash(evidence)), // evidence_hash
        prepareReq.proposer_address,
    );
    const hash = getHeaderHash(header);
    LoggerInfo("start block proposal", ["height", height.toString(), "hash", hash, "termId", termId.toString(), "optimistic_execution", optimisticExecution.toString()])
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
        return null;
    }
    let metainfo = new Map<string,Base64String>()
    if (optimisticExecution) {
        const oeresp = doOptimisticExecution(processReq, processResp);
        metainfo = oeresp.metainfo;
    }
    // We have a valid proposal to propagate to other nodes
    const entry = buildLogEntryAggregate(processReq, header, sortedBlockCommits, optimisticExecution, metainfo, validatorSet);
    return new BuildProposal(entry, processReq);
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
    if (header.height != currentState.nextHeight) return `header height mismatch: expected ${currentState.nextHeight}, got ${header.height}`

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
    if (Date.fromString(header.time).getTime() <= Date.fromString(currentState.last_time).getTime()) {
        return `header time mismatch: expected higher than ${currentState.last_time}, got ${header.time}`
    }
    // TODO set an upper time bound

    // TODO
    // header.last_commit_hash
    // header.next_validators_hash
    // header.validators_hash
    // header.evidence_hash
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

export function buildLogEntryAggregate(processReq: typestnd.RequestProcessProposal, header: typestnd.Header, blockCommit: typestnd.BlockCommit, optimisticExecution: boolean, meta: Map<string,Base64String>, validatorSet: typestnd.TendermintValidators): LogEntryAggregate {
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
    return entry;
}

export function getMempool(): Mempool {
    const mempool = fsm.getContextValue(cfg.MEMPOOL_KEY);
    if (mempool === "") return  new Mempool(new Map<string, MempoolTx>());
    return JSON.parse<Mempool>(mempool);
}

export function setMempool(mempool: Mempool): void {
    fsm.setContextValue(cfg.MEMPOOL_KEY, JSON.stringify<Mempool>(mempool));
}

export function getMaxTxBytes(): i64 {
    const value = fsm.getContextValue(cfg.MAX_TX_BYTES);
    if (value === "") return i64(0);
    return parseInt64(value);
}

export function setMaxTxBytes(value: i64): void {
    fsm.setContextValue(cfg.MAX_TX_BYTES, value.toString());
}

export function updateValidators(updates: typestnd.ValidatorUpdate[]): void {
    if (updates.length == 0) return;
    const calldata = `{"UpdateValidators":{"updates":${JSON.stringify<typestnd.ValidatorUpdate[]>(updates)}}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0) {
        revert("could not update validators");
    }
}

export function updateConsensusParams(height: i64, updates: typestnd.ConsensusParams | null): void {
    if (updates == null) {
        // we store them for the next block
        setConsensusParams(height + 1, updates);
        return
    }
    const params = getConsensusParams(height);
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
    // we store them for the next block
    setConsensusParams(height + 1, params);
}

export function setConsensusParams(height: i64, value: typestnd.ConsensusParams | null): void {
    let params = ""
    if (value != null) {
        const valuestr = JSON.stringify<typestnd.ConsensusParams>(value)
        params = encodeBase64(Uint8Array.wrap(String.UTF8.encode(valuestr)))
    }
    const calldata = `{"setConsensusParams":{"height":${height},"params":"${params}"}}`
    const resp = callStorage(calldata, false);
    if (resp.success > 0) {
        revert("could not set consensus params");
    }
}

function getConsensusParams(height: i64): typestnd.ConsensusParams {
    const calldata = `{"getConsensusParams":{"height":${height}}}`
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

function getRandomInRange(min: i64, max: i64): i64 {
    const rand = Math.random()
    const numb = Math.floor(rand * f64((max - min + 1)))
    return i64(numb) + min;
}

export function signMessage(msgstr: string): Base64String {
    const currentState = getCurrentState();
    return wasmxw.ed25519Sign(currentState.validator_privkey, msgstr);
}

export function signMessageBytes(msg: ArrayBuffer): Base64String {
    const currentState = getCurrentState();
    return wasmxw.ed25519SignBytes(currentState.validator_privkey, msg);
}

export function startBlockFinalizationLeader(index: i64): boolean {
    // get entry and apply it
    const entryobj = getLogEntryAggregate(index);
    if (entryobj == null) {
        LoggerInfo("cannot start block finalization", ["height", index.toString(), "reason", "block empty"])
        return false;
    }
    LoggerInfo("start block finalization", ["height", index.toString(), "termId",  entryobj.termId.toString(), "proposerId", entryobj.leaderId.toString()])
    LoggerDebug("start block finalization", ["height", index.toString(), "data", JSON.stringify<wblocks.BlockEntry>(entryobj.data)])

    const currentTerm = getTermId();
    if (currentTerm == entryobj.termId) {
        return startBlockFinalizationInternal(entryobj, false);
    } else {
        LoggerError("entry has current term mismatch", ["nodeType", "Leader", "currentTerm", currentTerm.toString(), "entryTermId", entryobj.termId.toString()])
        return false;
    }
}

export function startBlockFinalizationFollower(index: i64): boolean {
    // get entry and apply it
    const entryobj = getLogEntryAggregate(index);
    if (entryobj == null) {
        LoggerInfo("cannot start block finalization", ["height", index.toString(), "reason", "block empty"])
        return false;
    }
    return startBlockFinalizationFollowerInternal(entryobj)
}

export function startBlockFinalizationFollowerInternal(entryobj: LogEntryAggregate): boolean {
    LoggerInfo("start block finalization", ["height", entryobj.index.toString(), "termId", entryobj.termId.toString()])
    LoggerDebug("start block finalization", ["height", entryobj.index.toString(), "proposerId", entryobj.leaderId.toString(), "termId", entryobj.termId.toString(), "data", JSON.stringify<wblocks.BlockEntry>(entryobj.data)])
    return startBlockFinalizationInternal(entryobj, false);
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

    // TODO optimistic execution?
    // TODO endblock
    const resbegin = consensuswrap.BeginBlock(finalizeReq);
    if (resbegin.error.length > 0) {
        revert(`${resbegin.error}`);
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
    const state = getCurrentState();
    state.app_hash = finalizeResp.app_hash;
    state.last_block_id = getBlockID(finalizeReq.hash)
    state.last_commit_hash = last_commit_hash
    state.last_results_hash = last_results_hash
    state.last_time = finalizeReq.time
    setCurrentState(state);
    // update consensus params
    LoggerDebug("updating consensus parameters...", [])
    const consensusUpd = finalizeResp.consensus_param_updates
    updateConsensusParams(processReq.height, consensusUpd);

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
    LoggerInfo("block finalized", ["height", entryobj.index.toString(), "hash", base64ToHex(finalizeReq.hash).toUpperCase(), "proposer", finalizeReq.proposer_address])

    // make sure termId is synced
    setTermId(entryobj.termId)

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
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function callStaking(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest("staking", calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function callHookContract(hookName: string, data: string): void {
    callHookContractInternal(roles.ROLE_HOOKS, hookName, data)
}

export function callHookNonCContract(hookName: string, data: string): void {
    callHookContractInternal(roles.ROLE_HOOKS_NONC, hookName, data)
}

export function callHookContractInternal(contractRole: string, hookName: string, data: string): void {
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(data)))
    const calldatastr = `{"RunHook":{"hook":"${hookName}","data":"${dataBase64}"}}`;
    const resp = callContract(contractRole, calldatastr, false)
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

export function getTotalStaked(validators: staking.Validator[]): BigInt {
    let bonded = BigInt.zero();
    for (let i = 0; i < validators.length; i++) {
        // @ts-ignore
        bonded += validators[i].tokens;
    }
    return bonded
}

export function getTotalStakedActive(validators: staking.Validator[]): BigInt {
    let bonded = BigInt.zero();
    for (let i = 0; i < validators.length; i++) {
        if (validators[i].jailed || validators[i].status != staking.BondedS) {
            continue;
        }
        // @ts-ignore
        bonded += validators[i].tokens;
    }
    return bonded
}

function getBFTThreshold(totalState: BigInt): BigInt {
    return totalState.mul(BigInt.fromU32(2)).div(BigInt.fromU32(3))
}
