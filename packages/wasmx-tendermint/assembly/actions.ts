import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import {
  Base64String,
  CallRequest,
  CallResponse,
} from 'wasmx-env/assembly/types';
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { CurrentState, Mempool } from "./types_blockchain";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { hexToUint8Array, parseInt32, parseInt64, uint8ArrayToHex, i64ToUint8ArrayBE, parseUint8ArrayToU32BigEndian } from "wasmx-utils/assembly/utils";
import { base64ToHex, hex64ToBase64 } from './utils';
import { LogEntry, LogEntryAggregate, AppendEntry, NodeUpdate, UpdateNodeResponse, AppendEntryResponse, TransactionResponse, Precommit } from "./types";
import { LoggerDebug, LoggerInfo, LoggerError, revert } from "./utils";

const ROUND_TIMEOUT = "roundTimeout";

//// Cosmos-specific
const MEMPOOL_KEY = "mempool";
const MAX_TX_BYTES = "max_tx_bytes";

//// blockchain
const VALIDATORS_KEY = "validators";
const STATE_KEY = "state";

// const

const LOG_START = 1;
const STATE_SYNC_BATCH = 200;
const ERROR_INVALID_TX = "transaction is invalid";
const MAX_LOGGED = 2000;
// ABCISemVer is the semantic version of the ABCI protocol
const ABCISemVer  = "2.0.0"
const ABCIVersion = ABCISemVer
// P2PProtocol versions all p2p behavior and msgs.
// This includes proposer selection.
const P2PProtocol: u64 = 8
// BlockProtocol versions all block data structures and processing.
// This includes validity of blocks and state updates.
const BlockProtocol: u64 = 12;
//// blockchain constants
// MaxBlockSizeBytes is the maximum permitted size of the blocks.
export const MaxBlockSizeBytes = 104857600 // 100MB
// BlockPartSizeBytes is the size of one block part.
export const BlockPartSizeBytes: u32 = 65536 // 64kB
// MaxBlockPartsCount is the maximum number of block parts.
export const MaxBlockPartsCount = (MaxBlockSizeBytes / BlockPartSizeBytes) + 1

/// Context values
const NODE_IPS = "nodeIPs";
const CURRENT_NODE_ID = "currentNodeId";
const ELECTION_TIMEOUT_KEY = "electionTimeout";
const TERM_ID = "currentTerm"; // current round
const NEXT_INDEX_ARRAY = "nextIndex";
const MATCH_INDEX_ARRAY = "matchIndex";

const NODE_UPDATE_REMOVE = 0
const NODE_UPDATE_ADD = 1
const NODE_UPDATE_UPDATE = 2

// guards

export function isNextProposer(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const currentState = getCurrentState();
    const validators = getValidators();
    console.debug("* isNextProposer validators: " + validators.length.toString())
    const totalPower = getTotalPower();
    LoggerDebug("isNextProposer", ["total power", totalPower.toString()])
    const proposerIndex = getNextProposer(currentState.last_block_id.hash, totalPower, validators);
    LoggerDebug("isNextProposer", ["next proposer", proposerIndex.toString()])
    const currentNode = getCurrentNodeId();
    return proposerIndex == currentNode;
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
    // if last block is not commited, we return; Cosmos SDK can only commit one block at a time.
    const height = getLastLogIndex();
    const lastCommitIndex = getLastBlockIndex();
    if (lastCommitIndex < height) {
        LoggerInfo("cannot propose new block, last block not commited", ["height", height.toString(), "lastCommitIndex", lastCommitIndex.toString()])
        return;
    }

    const mempool = getMempool();
    const cparams = getConsensusParams();
    let maxbytes = cparams.block.max_bytes;
    if (maxbytes == -1) {
        maxbytes = MaxBlockSizeBytes;
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
    LoggerDebug("incrementCurrentTerm", ["newterm", (termId + 1).toString()])
}

export function setupNode(
    params: ActionParam[],
    event: EventObject,
): void {
    let currentNodeId: string = "";
    let nodeIPs: string = "";
    let initChainSetup: string = "";
    for (let i = 0; i < event.params.length; i++) {
        if (event.params[i].key === CURRENT_NODE_ID) {
            currentNodeId = event.params[i].value;
            continue;
        }
        if (event.params[i].key === NODE_IPS) {
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
    fsm.setContextValue(CURRENT_NODE_ID, currentNodeId);

    // !! nodeIps must be the same for all nodes

    // TODO ID@host:ip
    // 6efc12ab37fc0e096d8618872f6930df53972879@0.0.0.0:26757
    fsm.setContextValue(NODE_IPS, nodeIPs);

    const datajson = String.UTF8.decode(decodeBase64(initChainSetup).buffer);
    // TODO remove validator private key from logs in initChainSetup
    LoggerDebug("setupNode", ["currentNodeId", currentNodeId, "nodeIPs", nodeIPs, "initChainSetup", datajson])
    const data = JSON.parse<typestnd.InitChainSetup>(datajson);
    const ips = JSON.parse<string[]>(nodeIPs);
    // TODO better way; we may have the leader's node ip here
    if (ips.length < data.validators.length) {
        revert(`Node IPS count ${ips.length.toString()} mismatch validator count ${data.validators.length}`);
    }
    initChain(data);

    initializeIndexArrays(ips.length);
}

export function registeredCheck(
    params: ActionParam[],
    event: EventObject,
): void {
    // when a node starts, it needs to add itself to the pack
    // we just need [ourIP, leaderIP]

    // if blocks, return
    const lastIndex = getLastLogIndex();
    if (lastIndex > LOG_START) {
        return;
    }
    // if we are alone, return
    const ips = getNodeIPs();
    if (ips.length == 1) {
        return;
    }
    // we have tried to become leader 2 times
    const termId = getTermId();
    if (termId < 2) {
        return;
    }
    LoggerInfo("trying to register node IP with Leader", []);

    // send updateNode to all ips except us
    const nodeId = getCurrentNodeId();
    const nodeIp = ips[nodeId];
    // TODO signature on protobuf encoding, not JSON
    const validatorInfo = getCurrentValidator();
    const validatorInfoStr = encodeBase64(Uint8Array.wrap(String.UTF8.encode(JSON.stringify<typestnd.ValidatorInfo>(validatorInfo))))
    const updateMsg = new NodeUpdate(nodeIp, nodeId, NODE_UPDATE_ADD, validatorInfoStr);
    const updateMsgStr = JSON.stringify<NodeUpdate>(updateMsg);
    const signature = signMessage(updateMsgStr);

    // const msgstr = `{"run":{"event":{"type":"nodeUpdate","params":[{"key": "ip","value":"${updateMsg.ip.toString()}"},{"key": "index","value":"${updateMsg.index.toString()}"},{"key": "removed","value":"0"},{"key": "signature","value":"${signature}"}]}}}`
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(updateMsgStr)));
    const msgstr = `{"run":{"event":{"type":"nodeUpdate","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));
    LoggerInfo("register request", ["req", msgstr])

    // we send the request to the same contract
    const contract = wasmx.getAddress();

    for (let i = 0; i < ips.length; i++) {
        // don't send to ourselves or to removed nodes
        if (i == nodeId || ips[i] == "") continue;
        LoggerInfo("register request", ["IP", ips[i]])
        const response = wasmxwrap.grpcRequest(ips[i], Uint8Array.wrap(contract), msgBase64);
        LoggerInfo("register response", ["error", response.error, "data", response.data])
        if (response.error.length > 0 || response.data.length == 0) {
            return
        }
        const resp = JSON.parse<UpdateNodeResponse>(response.data);
        if (resp.nodeIPs[resp.nodeId] != nodeIp) {
            LoggerError("register node response has wrong ip", ["expected", nodeIp]);
            revert(`register node response has wrong ip`)
        }
        const allvalidStr = String.UTF8.decode(decodeBase64(resp.validators).buffer);
        console.debug("* register node allvalidStr: " + allvalidStr)
        const allvalidators = JSON.parse<typestnd.ValidatorInfo[]>(allvalidStr);
        checkValidatorsUpdate(allvalidators, validatorInfo, resp.nodeId);
        setCurrentNodeId(resp.nodeId);
        setNodeIPs(resp.nodeIPs);
        setValidators(allvalidators);
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
    LoggerDebug("received new block proposal", ["block", entryStr.slice(0, MAX_LOGGED) + " [...]"]);

    let entry: AppendEntry = JSON.parse<AppendEntry>(entryStr);
    LoggerInfo("received new block proposal", [
        "proposerId", entry.proposerId.toString(),
        "termId", entry.termId.toString(),
    ]);

    // TODO only accept proposal from expected proposer
    // verify signature
    const isSender = verifyMessage(entry.proposerId, signature, entryStr);
    if (!isSender) {
        LoggerError("signature verification failed for AppendEntry", ["leaderId", entry.proposerId.toString(), "termId", entry.termId.toString()]);
        return;
    }

    // update our nodeips
    const ips = getNodeIPs();
    const nodeId = getCurrentNodeId();
    const nodeIp = ips[nodeId];
    // check that our nodeId is still in line
    let newId = nodeId;
    for(let i = 0; i < entry.nodeIps.length; i++) {
        if (entry.nodeIps[i] == nodeIp) {
            newId = i;
            break;
        }
    }
    if (newId != nodeId) {
        LoggerDebug("our node ID has changed", ["old", nodeId.toString(), "new", newId.toString()])
        setCurrentNodeId(newId);
    }
    const allvalidStr = String.UTF8.decode(decodeBase64(entry.validators).buffer);
    console.debug("* processAppendEntries allvalidStr: " + allvalidStr)
    const allvalidators = JSON.parse<typestnd.ValidatorInfo[]>(allvalidStr);
    const validatorInfo = getCurrentValidator();
    checkValidatorsUpdate(allvalidators, validatorInfo, newId);
    setNodeIPs(entry.nodeIps);
    setValidators(allvalidators);

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
    return addTransactionToMempool(transaction)
}

export function sendAppendEntries(
    params: ActionParam[],
    event: EventObject,
): void {
    // go through each node
    const nodeId = getCurrentNodeId();
    const ips = getNodeIPs();
    LoggerDebug("diseminate blocks...", ["nodeId", nodeId.toString(), "ips", JSON.stringify<Array<string>>(ips)])
    for (let i = 0; i < ips.length; i++) {
        // don't send to Leader or removed nodes
        if (nodeId === i || ips[i].length == 0) continue;
        sendAppendEntry(i, ips[i], ips);
    }
}

export function sendAppendEntry(
    nodeId: i32,
    nodeIp: string,
    nodeIps: string[],
): void {
    const nextIndexPerNode = getNextIndexArray();
    const nextIndex = nextIndexPerNode.at(nodeId);
    let lastIndex = getLastLogIndex();
    // TODO state sync & snapshotting
    // right now, don't send more than STATE_SYNC_BATCH blocks at a time
    if ((lastIndex - nextIndex) > STATE_SYNC_BATCH) {
        lastIndex = nextIndex + STATE_SYNC_BATCH;
    }

    const entries: Array<LogEntryAggregate> = [];
    for (let i = nextIndex; i <= lastIndex; i++) {
        const entry = getLogEntryAggregate(i);
        entries.push(entry);
    }
    const previousEntry = getLogEntryObj(nextIndex-1);
    const lastCommitIndex = getLastBlockIndex();
    const validators = encodeBase64(Uint8Array.wrap(String.UTF8.encode(fsm.getContextValue(VALIDATORS_KEY))))
    const data = new AppendEntry(
        getTermId(),
        getCurrentNodeId(),
        entries,
        nodeIps,
        validators,
    )
    const datastr = JSON.stringify<AppendEntry>(data);
    const signature = signMessage(datastr);

    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveProposal","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`

    LoggerDebug("diseminate blocks...", ["nodeId", nodeId.toString(), "receiver", nodeIp, "count", entries.length.toString(), "from", nextIndex.toString(), "to", lastIndex.toString()])
    const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));
    // we send the request to the same contract
    const contract = wasmx.getAddress();
    const response = wasmxwrap.grpcRequest(nodeIp, Uint8Array.wrap(contract), msgBase64);
    if (response.error.length > 0) {
        return
    }
    const resp = JSON.parse<AppendEntryResponse>(response.data);
    // TODO something with resp.term
    if (resp.success) {
        nextIndexPerNode[nodeId] = nextIndex + entries.length;
        setNextIndexArray(nextIndexPerNode);
    }
}

export function sendPrecommits(
    params: ActionParam[],
    event: EventObject,
): void {
    // go through each node
    const nodeId = getCurrentNodeId();
    const ips = getNodeIPs();
    LoggerDebug("sending precommits...", ["nodeId", nodeId.toString(), "ips", JSON.stringify<Array<string>>(ips)])
    for (let i = 0; i < ips.length; i++) {
        // don't send to Leader or removed nodes
        if (nodeId === i || ips[i].length == 0) continue;
        sendPrecommit(i, ips[i]);
    }
}

export function sendPrecommit(
    nodeId: i32,
    nodeIp: string,
): void {
    const termId = getTermId();
    const lastIndex = getLastLogIndex();
    const proposerId = getCurrentNodeId()
    const entry: Precommit = new Precommit(termId, proposerId, lastIndex)
    const datastr = JSON.stringify<Precommit>(entry);
    const signature = signMessage(datastr);

    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receivePrecommit","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`

    LoggerDebug("sending precommit...", ["nodeId", nodeId.toString(), "receiver", nodeIp, "index", lastIndex.toString()])
    const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));
    // we send the request to the same contract
    const contract = wasmx.getAddress();
    const response = wasmxwrap.grpcRequest(nodeIp, Uint8Array.wrap(contract), msgBase64);
    if (response.error.length > 0) {
        LoggerError("precommit failed", ["nodeId", nodeId.toString(), "nodeIp", nodeIp])
    }
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
        return revert(`${ERROR_INVALID_TX}; code ${checkResp.code}`);
    }

    // add to mempool
    const mempool = getMempool();
    // TODO actually decode tx
    // const parsedTx = decodeTx(transaction);
    const parsedTx =  new typestnd.Transaction(15000000);
    const cparams = getConsensusParams();
    const maxgas = cparams.block.max_gas;
    if (maxgas > -1 && maxgas < parsedTx.gas) {
        return revert(`out of gas: ${parsedTx.gas}; max ${maxgas}`);
    }
    mempool.add(transaction, parsedTx.gas);
    setMempool(mempool);
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
    const termId = getTermId();
    const lastLogIndex = getLastLogIndex();
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
    let successful = true;
    if (entry.entries.length > 0 && entry.entries[0].index > lastLogIndex) {
        successful = false;
    }

    const response = new AppendEntryResponse(termId, successful);
    LoggerDebug("send proposal response", ["termId", termId.toString(), "success", "true"])
    wasmx.setFinishData(String.UTF8.encode(JSON.stringify<AppendEntryResponse>(response)));
}

// temporary node updates - only for Leader
export function updateNodeAndReturn(
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
        revert("updateNodeAndReturn: empty entry");
    }
    if (signature === "") {
        revert("updateNodeAndReturn: empty signature");
    }
    const entryStr = String.UTF8.decode(decodeBase64(entryBase64).buffer);
    LoggerDebug("updateNodeAndReturn", ["entry", entryStr, "signature", signature])
    let entry: NodeUpdate = JSON.parse<NodeUpdate>(entryStr);

    LoggerInfo("update node", ["ip", entry.ip, "type", entry.type.toString(), "validator_info", "index", entry.index.toString(), entry.validator_info])

    const ips = getNodeIPs();
    let entryIndex = entry.index;

    if (entry.type == NODE_UPDATE_ADD) {
        if (entry.validator_info == "") {
            LoggerError("validator info missing from node update", ["ip", entry.ip])
            return;
        }
        // make it idempotent & don't add same ip multiple times
        if (ips.includes(entry.ip)) {
            LoggerDebug("ip already included", ["ip", entry.ip])
            return;
        }
        entryIndex = ips.length;

        // verify signature and store the new validator
        const validatorInfo = JSON.parse<typestnd.ValidatorInfo>(String.UTF8.decode(decodeBase64(entry.validator_info).buffer))
        const isSender = wasmxwrap.ed25519Verify(validatorInfo.pub_key, signature, entryStr);
        if (!isSender) {
            LoggerError("signature verification failed", ["nodeIndex", entryIndex.toString(), "nodeIp", entry.ip]);
            return;
        }

        const validators = getValidators();
        validators.push(validatorInfo);
        setValidators(validators);

    } else {
        // verify signature
        const isSender = verifyMessage(entryIndex, signature, entryStr);
        if (!isSender) {
            LoggerError("signature verification failed", ["nodeIndex", entryIndex.toString(), "nodeIp", entry.ip]);
            return;
        }
    }

    // removed
    if (entry.type == NODE_UPDATE_REMOVE) {
        // idempotent
        ips[entryIndex] = "";
    } else if (entry.type == NODE_UPDATE_ADD) {
        ips.push(entry.ip);
        const nextIndexes = getNextIndexArray();
        nextIndexes.push(LOG_START + 1);
        setNextIndexArray(nextIndexes);
        const validators = encodeBase64(Uint8Array.wrap(String.UTF8.encode(fsm.getContextValue(VALIDATORS_KEY))))
        const response = new UpdateNodeResponse(ips, entryIndex, validators);
        wasmx.setFinishData(String.UTF8.encode(JSON.stringify<UpdateNodeResponse>(response)));
    } else {
        // NODE_UPDATE_UPDATE
        // just update the ip
        ips[entryIndex] = entry.ip;
    }

    LoggerInfo("node updates", ["ips", ips.join(",")])
    setNodeIPs(ips);
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
    LoggerDebug("received precommit", ["Precommit", entryStr.slice(0, MAX_LOGGED) + " [...]"]);

    let entry: Precommit = JSON.parse<Precommit>(entryStr);
    LoggerInfo("received precommit", [
        "proposerId", entry.proposerId.toString(),
        "termId", entry.termId.toString(),
        "height", entry.index.toString(),
    ]);

    // verify signature
    const isSender = verifyMessage(entry.proposerId, signature, entryStr);
    if (!isSender) {
        LoggerError("signature verification failed for AppendEntry", ["leaderId", entry.proposerId.toString(), "termId", entry.termId.toString()]);
        return;
    }

    startBlockFinalizationFollower(entry.index);
}

// utils

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

    let calldata = `{"getContextValue":{"key":"nodeIPs"}}`
    let req = new CallRequest(oldContract, calldata, 0, 100000000, true);
    let resp = wasmxwrap.call(req);
    if (resp.success > 0) {
        return revert("cannot get nodeIPs from previous contract")
    }
    let data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up nodeIPs", ["ips", data])
    const nodeIps = JSON.parse<Array<string>>(data)
    setNodeIPs(nodeIps);

    calldata = `{"getContextValue":{"key":"validators"}}`
    req = new CallRequest(oldContract, calldata, 0, 100000000, true);
    resp = wasmxwrap.call(req);
    if (resp.success > 0) {
        return revert("cannot get validators from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up validators", ["data", data])
    const validators = JSON.parse<typestnd.ValidatorInfo[]>(data)
    setValidators(validators);

    calldata = `{"getContextValue":{"key":"state"}}`
    req = new CallRequest(oldContract, calldata, 0, 100000000, true);
    resp = wasmxwrap.call(req);
    if (resp.success > 0) {
        return revert("cannot get state from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up state", ["data", data])
    const state = JSON.parse<CurrentState>(data)
    setCurrentState(state);

    calldata = `{"getContextValue":{"key":"mempool"}}`
    req = new CallRequest(oldContract, calldata, 0, 100000000, true);
    resp = wasmxwrap.call(req);
    if (resp.success > 0) {
        return revert("cannot get mempool from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up mempool", ["data", data])
    const mempool = JSON.parse<Mempool>(data)
    setMempool(mempool);

    calldata = `{"getContextValue":{"key":"currentNodeId"}}`
    req = new CallRequest(oldContract, calldata, 0, 100000000, true);
    resp = wasmxwrap.call(req);
    if (resp.success > 0) {
        return revert("cannot get currentNodeId from previous contract")
    }
    data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    LoggerInfo("setting up currentNodeId", ["data", data])
    const currentNodeId = parseInt32(data);
    setCurrentNodeId(currentNodeId);

    calldata = `{"getContextValue":{"key":"currentTerm"}}`
    req = new CallRequest(oldContract, calldata, 0, 100000000, true);
    resp = wasmxwrap.call(req);
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
}

function getCurrentValidator(): typestnd.ValidatorInfo {
    const currentState = getCurrentState();
    // TODO voting_power & proposer_priority
    return new typestnd.ValidatorInfo(currentState.validator_address, currentState.validator_pubkey, 0, 0);
}

function setCurrentNodeId(index: i32): void {
    fsm.setContextValue(CURRENT_NODE_ID, index.toString());
}

function initChain(req: typestnd.InitChainSetup): void {
    LoggerDebug("start chain init", [])

    // TODO what are the correct empty valuew?
    // we need a non-empty string value, because we use this to compute next proposer
    const emptyBlockId = new typestnd.BlockID(req.app_hash, new typestnd.PartSetHeader(0, ""))
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
        req.wasmx_blocks_contract,
    );
    setValidators(req.validators);

    const valuestr = JSON.stringify<CurrentState>(currentState);
    LoggerDebug("set current state", ["state", valuestr])
    setCurrentState(currentState);
    setConsensusParams(req.consensus_params);
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

function initializeIndexArrays(len: i32): void {
    const lastLogIndex = getLastLogIndex()
    const nextIndex: Array<i64> = [];
    const matchIndex: Array<i64> = [];
    for (let i = 0; i < len; i++) {
        // for each server, index of the next log entry to send to that server (initialized to leader's last log index + 1)
        nextIndex[i] = lastLogIndex + 1;
        // for each server, index of highest log entry known to be replicated on server (initialized to 0, increases monotonically)
        matchIndex[i] = LOG_START; // TODO ?
    }
    setNextIndexArray(nextIndex);
    setMatchIndexArray(matchIndex);
}

function setMatchIndexArray(value: Array<i64>): void {
    fsm.setContextValue(MATCH_INDEX_ARRAY, JSON.stringify<Array<i64>>(value));
}

// this gets called each reentry in Leader.active state
function checkCommits(): void {
    const lastCommitIndex = getLastBlockIndex();
    // all commited + uncommited logs
    const lastLogIndex = getLastLogIndex();
    const currentNodeId = getCurrentNodeId();
    const nextIndexPerNode = getNextIndexArray();
    const validators = getValidators();
    const len = getNodeCount();
    const nodeId = getCurrentNodeId();
    let nextCommit = lastCommitIndex + 1;

    LoggerDebug("trying to commit next block...", ["lastCommitIndex", lastCommitIndex.toString(), "lastSaved", lastLogIndex.toString(), "blocksToCommit", (lastLogIndex >= nextCommit).toString()])

    if (lastLogIndex < nextCommit) {
        return;
    }
    const threshold = getBFTThreshold();
    let count = validators[nodeId].voting_power; // leader
    for (let i = 0; i < len; i++) {
        // next index is the next index to send, so we use >
        if (nextIndexPerNode.at(i) > nextCommit) {
            count += validators[i].voting_power;
        }
    }
    const committing = count >= threshold;
    LoggerDebug("trying to commit next block...", ["height", nextCommit.toString(), "nodes_count", len.toString(), "voting power", count.toString(), "threshold voting power", threshold.toString(), "committing", committing.toString()])

    // TODO If AppendEntries fails because of log inconsistency: decrement nextIndex and retry
    if (committing) {

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

function getNodeCount(): i32 {
    const ips = getNodeIPs();
    return getNodeCountInternal(ips);
}

function getNodeIPs(): Array<string> {
    const valuestr = fsm.getContextValue(NODE_IPS);
    let value: Array<string> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<string>>(valuestr);
    return value;
}

function setNodeIPs(ips: Array<string>): void {
    const valuestr = JSON.stringify<Array<string>>(ips);
    fsm.setContextValue(NODE_IPS, valuestr);
}

function getNodeCountInternal(ips: string[]): i32 {
    let count = 0;
    for (let i = 0; i < ips.length; i++) {
        if (ips[i].length > 0) {
            count += 1;
        }
    }
    return count;
}

function getNextIndexArray(): Array<i64> {
    const valuestr = fsm.getContextValue(NEXT_INDEX_ARRAY);
    let value: Array<i64> = [];
    if (valuestr === "") return value;
    value = JSON.parse<Array<i64>>(valuestr);
    return value;
}

function setNextIndexArray(arr: Array<i64>): void {
    fsm.setContextValue(NEXT_INDEX_ARRAY, JSON.stringify<Array<i64>>(arr));
}

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

function getNextProposer(blockHash: Base64String, totalPower: i64, validators: typestnd.ValidatorInfo[]): i32 {
    console.debug("-getNextProposer: " + blockHash)
    const hashbz = decodeBase64(blockHash);
    console.debug("-getNextProposer hashbz: " + hashbz.toString())
    const normalizer = Math.pow(2, 32);
    console.debug("-getNextProposer normalizer: " + normalizer.toString())
    const hashslice = Uint8Array.wrap(hashbz.buffer, 0, 4)
    const part = parseUint8ArrayToU32BigEndian(hashslice)
    console.debug("-getNextProposer part: " + part.toString())
    const valf = f64(part) / f64(normalizer) * f64(totalPower);
    const val = i64(valf);
    LoggerDebug("getNextProposer", ["hashslice", uint8ArrayToHex(hashslice), "part", part.toString(), "ratio", (f64(part) / f64(normalizer)).toString(), "val_f64", valf.toString(), "val", val.toString()])
    let closestVal: i32 = -1;
    let aggregatedVP: i64[] = new Array<i64>(validators.length);
    let lastSumVP: i64 = 0;
    for (let i = 0; i < validators.length; i++) {
        aggregatedVP[i] = validators[i].voting_power + lastSumVP;
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

function startBlockProposal(txs: string[], cummulatedGas: i64, maxDataBytes: i64): void {
    // PrepareProposal TODO finish
    const height = getLastLogIndex() + 1;
    LoggerDebug("start block proposal", ["height", height.toString()])

    const currentState = getCurrentState();
    const validators = getValidators();

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
    return appendLogInternalVerified(processReq, header, lastBlockCommit);
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
        commitBase64,
        "",
    )
    const entry = new LogEntryAggregate(processReq.height, termId, leaderId, blockEntry);
    appendLogEntry(entry);
}

// temporarily store the entries
export function appendLogEntry(
    entry: LogEntryAggregate,
): void {
    const index = getLastLogIndex() + 1;
    // TODO rollback entries in case of a network split (e.g. entries with higher termId than we have have priority); they must be uncommited
    // and just return if already saved
    if (index > entry.index) {
        LoggerDebug("already appended entry", ["height", entry.index.toString()])
        return;
    }
    if (index !== entry.index) {
        revert(`mismatched index while appending log entry: expected ${index}, found ${entry.index}`);
    }
    setLastLogIndex(index);
    setLogEntryAggregate(entry);
}

export function setLogEntryAggregate(
    entry: LogEntryAggregate,
): void {
    const blockData = encodeBase64(Uint8Array.wrap(String.UTF8.encode(JSON.stringify<wblocks.BlockEntry>(entry.data))))
    const tempEntry = new LogEntry(
        entry.index,
        entry.termId,
        entry.leaderId,
        blockData,
    )
    const data = JSON.stringify<LogEntry>(tempEntry);
    setLogEntry(entry.index, data);
}

export function setLogEntryObj(
    entry: LogEntry,
): void {
    const data = JSON.stringify<LogEntry>(entry);
    setLogEntry(entry.index, data);
}

export function setLogEntry(
    index: i64,
    entry: string,
): void {
    LoggerDebug("setting entry", ["height", index.toString(), "value", entry.slice(0, MAX_LOGGED) + " [...]"])
    const key = getLogEntryKey(index);
    fsm.setContextValue(key, entry);
}

// remove the temporary block data
export function removeLogEntry(
    index: i64,
): void {
    const entry = getLogEntryObj(index);
    entry.data = "";
    const data = JSON.stringify<LogEntry>(entry);
    setLogEntry(index, data)
}

export function getLogEntryObj(index: i64): LogEntry {
    const value = getLogEntry(index);
    if (value == "") return new LogEntry(0, 0, 0, "");
    return JSON.parse<LogEntry>(value);
}

export function getLogEntry(
    index: i64,
): string {
    const key = getLogEntryKey(index);
    return fsm.getContextValue(key);
}

export function getLogEntryKey(index: i64): string {
    return "logs_" + index.toString();
}

function getCurrentNodeId(): i32 {
    const value = fsm.getContextValue(CURRENT_NODE_ID);
    if (value === "") return i32(0);
    return parseInt32(value);
}

function getTermId(): i32 {
    const value = fsm.getContextValue(TERM_ID);
    if (value === "") return i32(0);
    return parseInt32(value);
}

function setTermId(value: i32): void {
    fsm.setContextValue(TERM_ID, value.toString());
}


export function getLastLogIndexKey(): string {
    return "logs_last_index";
}

export function getLastLogIndex(): i64 {
    const key = getLastLogIndexKey();
    const valuestr = fsm.getContextValue(key);
    if (valuestr != "") {
        const value = parseInt(valuestr);
        return i64(value);
    }
    return i64(LOG_START);
}

export function setLastLogIndex(
    value: i64,
): void {
    const key = getLastLogIndexKey();
    LoggerDebug("setting entry count", ["height", value.toString()])
    fsm.setContextValue(key, value.toString());
}

export function getMempool(): Mempool {
    const mempool = fsm.getContextValue(MEMPOOL_KEY);
    if (mempool === "") return  new Mempool(new Array<string>(0), new Array<i32>(0));
    return JSON.parse<Mempool>(mempool);
}

export function setMempool(mempool: Mempool): void {
    fsm.setContextValue(MEMPOOL_KEY, JSON.stringify<Mempool>(mempool));
}

export function getMaxTxBytes(): i64 {
    const value = fsm.getContextValue(MAX_TX_BYTES);
    if (value === "") return i64(0);
    return parseInt64(value);
}

export function setMaxTxBytes(value: i64): void {
    fsm.setContextValue(MAX_TX_BYTES, value.toString());
}

export function getValidators(): typestnd.ValidatorInfo[] {
    const value = fsm.getContextValue(VALIDATORS_KEY);
    if (value === "") return [];
    return JSON.parse<typestnd.ValidatorInfo[]>(value);
}

export function setValidators(value: typestnd.ValidatorInfo[]): void {
    fsm.setContextValue(VALIDATORS_KEY, JSON.stringify<typestnd.ValidatorInfo[]>(value));
}

export function updateValidators(updates: typestnd.ValidatorUpdate[]): void {
    const validators = getValidators();
    for (let i = 0; i < updates.length; i++) {
        for (let j = 0; j < validators.length; j++) {
            if (validators[j].pub_key == updates[i].pub_key) {
                validators[j].voting_power = updates[i].power;
            }
        }
    }
    setValidators(validators);
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

function setConsensusParams(value: typestnd.ConsensusParams): void {
    const valuestr = JSON.stringify<typestnd.ConsensusParams>(value)
    const calldata = `{"setConsensusParams":{"params":"${encodeBase64(Uint8Array.wrap(String.UTF8.encode(valuestr)))}"}}`
    const resp = callStorage(calldata, false);
    if (resp.success > 0) {
        revert("could not set consensus params");
    }
}

function getConsensusParams(): typestnd.ConsensusParams {
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

export function getCurrentState(): CurrentState {
    const value = fsm.getContextValue(STATE_KEY);
    // this must be set before we try to read it
    if (value === "") {
        revert("chain init setup was not ran")
    }
    return JSON.parse<CurrentState>(value);
}

export function setCurrentState(value: CurrentState): void {
    fsm.setContextValue(STATE_KEY, JSON.stringify<CurrentState>(value));
}

// ValidatorSet.Validators hash (ValidatorInfo[] hash)
// TODO cometbft protobuf encodes cmtproto.SimpleValidator
function getValidatorsHash(validators: typestnd.ValidatorInfo[]): string {
    let data = new Array<string>(validators.length);
    for (let i = 0; i < validators.length; i++) {
        // hex
        const pub_key = hexToUint8Array(validators[i].pub_key);
        const power = i64ToUint8ArrayBE(validators[i].voting_power);
        const newdata = new Uint8Array(pub_key.length + power.length);
        newdata.set(pub_key, 0);
        newdata.set(power, pub_key.length);
        data[i] = uint8ArrayToHex(newdata);
    }
    return wasmxwrap.MerkleHash(data);
}

// Txs.Hash() -> [][]byte merkle.HashFromByteSlices
// base64
export function getTxsHash(txs: string[]): string {
    return wasmxwrap.MerkleHash(txs);
}

// Hash returns a hash of a subset of the parameters to store in the block header.
// Only the Block.MaxBytes and Block.MaxGas are included in the hash.
// This allows the ConsensusParams to evolve more without breaking the block
// protocol. No need for a Merkle tree here, just a small struct to hash.
// cometbft: cmtproto.HashedParams
export function getConsensusParamsHash(params: typestnd.ConsensusParams): string {
    const value = JSON.stringify<typestnd.BlockParams>(params.block);
    const hash = wasmx.sha256(String.UTF8.encode(value));
    return encodeBase64(Uint8Array.wrap(hash));
}

// []Evidence hash
// TODO
export function getEvidenceHash(params: typestnd.Evidence): string {
    return wasmxwrap.MerkleHash([]);
}

export function getCommitHash(lastCommit: typestnd.BlockCommit): string {
    // TODO MerkleHash(lastCommit.signatures)
    return wasmxwrap.MerkleHash([]);
}

export function getResultsHash(results: typestnd.ExecTxResult[]): string {
    const data = new Array<string>(results.length);
    for (let i = 0; i < results.length; i++) {
        data[i] = encodeBase64(Uint8Array.wrap(String.UTF8.encode(JSON.stringify<typestnd.ExecTxResult>(results[i]))));
    }
    return wasmxwrap.MerkleHash(data);
}

// Hash returns the hash of the header.
// It computes a Merkle tree from the header fields
// ordered as they appear in the Header.
// Returns nil if ValidatorHash is missing,
// since a Header is not valid unless there is
// a ValidatorsHash (corresponding to the validator set).
function getHeaderHash(header: typestnd.Header): string {
    const versionbz = String.UTF8.encode(JSON.stringify<typestnd.VersionConsensus>(header.version));
    const blockidbz = String.UTF8.encode(JSON.stringify<typestnd.BlockID>(header.last_block_id));
    const data = [
        encodeBase64(Uint8Array.wrap(versionbz)),
        encodeBase64(Uint8Array.wrap(String.UTF8.encode(header.chain_id))),
        encodeBase64(i64ToUint8ArrayBE(header.height)),
        encodeBase64(Uint8Array.wrap(String.UTF8.encode(header.time))),
        encodeBase64(Uint8Array.wrap(blockidbz)),
        hex64ToBase64(header.last_commit_hash),
        hex64ToBase64(header.data_hash),
        hex64ToBase64(header.validators_hash),
        hex64ToBase64(header.next_validators_hash),
        hex64ToBase64(header.consensus_hash),
        hex64ToBase64(header.app_hash),
        hex64ToBase64(header.last_results_hash),
        hex64ToBase64(header.evidence_hash),
        hex64ToBase64(header.proposer_address), // TODO transform hex to base64
    ]
    return wasmxwrap.MerkleHash(data);
}

function getRandomInRange(min: i64, max: i64): i64 {
    const rand = Math.random()
    const numb = Math.floor(rand * f64((max - min + 1)))
    return i64(numb) + min;
}

export function signMessage(msgstr: string): Base64String {
    const currentState = getCurrentState();
    return wasmxwrap.ed25519Sign(currentState.validator_privkey, msgstr);
}

export function verifyMessage(nodeIndex: i32, signatureStr: Base64String, msg: string): boolean {
    const validators = getValidators();
    const validator = validators[nodeIndex];
    return wasmxwrap.ed25519Verify(validator.pub_key, signatureStr, msg);
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

    const commitBz = String.UTF8.decode(decodeBase64(entryobj.data.commit).buffer);
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
        const hash = wasmxwrap.sha256(finalizeReq.txs[i]);
        txhashes.push(hash);
    }
    // also indexes transactions
    setFinalizedBlock(entryobj, finalizeReq.hash, txhashes);

    // remove temporary block data
    removeLogEntry(entryobj.index);

    // before commiting, we check if consensus contract was changed
    let newContract = "";
    let newLabel = "";
    for (let i = 0; i < finalizeResp.events.length; i++) {
        const ev = finalizeResp.events[i];
        if (ev.type == "register_role") {
            for (let j = 0; j < ev.attributes.length; j++) {
                if (ev.attributes[j].key == "contract_address") {
                    newContract = ev.attributes[j].value;
                }
                if (ev.attributes[j].key == "role_label") {
                    newLabel = ev.attributes[j].value;
                }
            }
            break;
        }
    }
    // we have finalized and saved the new block
    // so we can execute setup on the new contract
    // this way, the delay of the timed action that starts the new consensus fsm is minimal.
    let newContractSetup = false;
    if (newContract !== "") {
        const myaddress = wasmxwrap.addr_humanize(wasmx.getAddress());
        LoggerInfo("setting up next consensus contract", ["new contract", newContract, "previous contract", myaddress])
        let calldata = `{"run":{"event":{"type":"setup","params":[{"key":"address","value":"${myaddress}"}]}}}`
        let req = new CallRequest(newContract, calldata, 0, 100000000, false);
        let resp = wasmxwrap.call(req);
        if (resp.success > 0) {
            LoggerError("cannot setup next consensus contract", ["new contract", newContract, "err", resp.data]);
        } else {
            LoggerInfo("next consensus contract is set", ["new contract", newContract])
            newContractSetup = true;

            // stop this contract and any intervals on this contract
            // TODO cancel all intervals on stop() action
            calldata = `{"run":{"event":{"type":"stop","params":[]}}}`
            req = new CallRequest(myaddress, calldata, 0, 100000000, false);
            resp = wasmxwrap.call(req);
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
        let calldata = `{"run":{"event":{"type":"start","params":[]}}}`
        let req = new CallRequest(newContract, calldata, 0, 100000000, false);
        let resp = wasmxwrap.call(req);
        if (resp.success > 0) {
            LoggerError("cannot start next consensus contract", ["new contract", newContract, "err", resp.data]);
            // we can restart the old contract here, so the chain does not stop
            const myaddress = wasmxwrap.addr_humanize(wasmx.getAddress());
            calldata = `{"run":{"event":{"type":"restart","params":[]}}}`
            req = new CallRequest(myaddress, calldata, 0, 100000000, false);
            resp = wasmxwrap.call(req);
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

function setFinalizedBlock(entry: LogEntryAggregate, hash: string, txhashes: string[]): void {
    const blockData = JSON.stringify<wblocks.BlockEntry>(entry.data)
    const calldata = new wblockscalld.CallDataSetBlock(blockData, hash, txhashes);
    const calldatastr = `{"setBlock":${JSON.stringify<wblockscalld.CallDataSetBlock>(calldata)}}`;
    const resp = callStorage(calldatastr, false);
    if (resp.success > 0) {
        revert("could not set finalized block");
    }
}

function callStorage(calldata: string, isQuery: boolean): CallResponse {
    const contractAddress = getStorageAddress();
    const req = new CallRequest(contractAddress, calldata, 0, 100000000, isQuery);
    const resp = wasmxwrap.call(req);
    if (resp.success == 0) {
        resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    }
    return resp;
}

function getStorageAddress(): string {
    const state = getCurrentState();
    return state.wasmx_blocks_contract;

}

function getTotalPower(): i64 {
    const validators = getValidators()
    let totalPow: i64 = 0;
    for (let i = 0; i < validators.length; i++) {
        totalPow += validators[i].voting_power;
    }
    return totalPow
}

function getBFTThreshold(): i64 {
    let totalPow = getTotalPower()
    return i64(f64.floor(f64(totalPow) / 3 * 2) + 1)
}
