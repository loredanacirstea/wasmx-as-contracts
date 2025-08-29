import { JSON } from "json-as";
import * as base64 from "as-base64/assembly"
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { DEFAULT_GAS_TX } from "wasmx-env/assembly/const";
import * as mctypes from "wasmx-consensus/assembly/types_multichain";
import * as hooks from "wasmx-env/assembly/hooks";
import * as roles from "wasmx-env/assembly/roles";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import { LoggerDebug, LoggerDebugExtended, LoggerError, LoggerInfo, revert } from "./utils";
import {
  Base64String,
  Bech32String,
  CallRequest,
  CallResponse,
  HexString,
  PublicKey,
  SignedTransaction,
} from 'wasmx-env/assembly/types';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as staking from "wasmx-stake/assembly/types";
import { NodeInfo } from "wasmx-p2p/assembly/types";
import * as modnames from "wasmx-env/assembly/modules";
import * as stakingutils from "wasmx-stake/assembly/msg_utils";
import { LogEntry, MODULE_NAME } from "./types_raft";
import { BigInt } from "wasmx-env/assembly/bn";
import { getCurrentState, getLastLogIndex, getLogEntryObj, getNodeIPs, setCurrentState, setMatchIndexArray, setNextIndexArray } from "./storage";
import * as cfg from "./config";
import { CurrentState } from "./types_blockchain";
import { base64ToHex, base64ToString } from "wasmx-utils/assembly/utils";
import { callContract } from "wasmx-env/assembly/utils";
import { CosmosmodGenesisState, IsNodeValidator } from "./types";

export function getBlockID(hash: Base64String): typestnd.BlockID {
    const hexhash = base64ToHex(hash)
    return new typestnd.BlockID(hexhash, new typestnd.PartSetHeader(1, hexhash))
}

export function getMajority(count: i32): i64 {
    return i64(f64.floor(f64(count) / 2) + 1)
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

// includes both min and max
export function getRandomInRange(min: i64, max: i64): i64 {
    const rand = Math.random()
    const numb = Math.floor(rand * f64((max - min + 1)))
    return i64(numb) + min;
}

export function getRandomInRangeI64(min: i64, max: i64): i64 {
    return getRandomInRange(min, max);
}

export function getRandomInRangeI32(min: i32, max: i32): i32 {
    const rand = Math.random()
    const numb = Math.floor(rand * f32((max - min + 1)))
    return i32(numb) + min;
}

export function signMessage(msgstr: string): Base64String {
    const currentState = getCurrentState();
    return wasmxw.ed25519Sign(currentState.validator_privkey, msgstr);
}

export function getNodeByAddress(addr: Bech32String, nodes: NodeInfo[]): NodeInfo | null {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].address == addr) {
            return nodes[i]
        }
    }
    return null
}

export function getNodeIdByAddress(addr: Bech32String, nodes: NodeInfo[]): i32 {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].address == addr) {
            return i;
        }
    }
    return -1;
}

export function verifyMessage(nodeIndex: i32, signatureStr: Base64String, msg: string): boolean {
    const nodes = getNodeIPs();
    const addr = nodes[nodeIndex].address;
    return verifyMessageByAddr(addr, signatureStr, msg);
}

export function verifyMessageByAddr(addr: Bech32String, signatureStr: Base64String, msg: string): boolean {
    const pubKey = getConsensusKeyByAddr(addr)
    if (pubKey == null) {
        LoggerDebug("could not verify mesage: empty consensus_pubkey", ["address", addr])
        return false;
    }
    return wasmxw.ed25519Verify(pubKey.getKey().key, signatureStr, msg);
}

export function verifyMessageBytesByAddr(addr: Bech32String, signatureStr: Base64String, msg: ArrayBuffer): boolean {
    const pubKey = getConsensusKeyByAddr(addr)
    if (pubKey == null) {
        LoggerDebug("could not verify mesage: empty consensus_pubkey", ["address", addr])
        return false;
    }
    return wasmxw.ed25519VerifyBytes(pubKey.getKey().key, signatureStr, msg);
}

export function getConsensusKeyByAddr(addr: Bech32String): PublicKey | null {
    const validators = getAllValidators();
    let validator: staking.Validator | null = null;
    for (let i = 0; i < validators.length; i++) {
        if (validators[i].operator_address == addr) {
            validator = validators[i]
        }
    }
    if (validator == null) {
        LoggerDebug("could not verify mesage: validator not found", ["address", addr])
        return null;
    }
    return validator.consensus_pubkey;
}

export function setFinalizedBlock(blockData: string, hash: string, txhashes: string[], indexedTopics: wblockscalld.IndexedTopic[]): void {
    const calldata = new wblockscalld.CallDataSetBlock(blockData, hash, txhashes, indexedTopics);
    const calldatastr = `{"setBlock":${JSON.stringify<wblockscalld.CallDataSetBlock>(calldata)}}`;
    const resp = callStorage(calldatastr, false);
    if (resp.success > 0) {
        revert(`could not set finalized block: ${resp.data}`);
    }
}

export function getLastBlockIndex(): i64 {
    const calldatastr = `{"getLastBlockIndex":{}}`;
    const resp = callStorage(calldatastr, false);
    if (resp.success > 0) {
        revert(`could not get last block index`);
    }
    const res = JSON.parse<wblockscalld.LastBlockIndexResult>(resp.data);
    return res.index;
}

export function getFinalBlock(index: i64): string {
    const calldata = new wblockscalld.CallDataGetBlockByIndex(index);
    const calldatastr = `{"getBlockByIndex":${JSON.stringify<wblockscalld.CallDataGetBlockByIndex>(calldata)}}`;
    const resp = callStorage(calldatastr, false);
    if (resp.success > 0) {
        revert(`could not get finalized block: ${index.toString()}`);
    }
    return resp.data;
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

export function getConsensusParams(height: i64): typestnd.ConsensusParams {
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

export function updateValidators(updates: typestnd.ValidatorUpdate[]): void {
    if (updates.length == 0) return;
    const calldata = `{"UpdateValidators":{"updates":${JSON.stringify<typestnd.ValidatorUpdate[]>(updates)}}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0) {
        revert("could not update validators");
    }
}

export function getValidatorByHexAddr(addr: HexString): staking.Validator {
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

export function getAllValidators(): staking.Validator[] {
    const calldata = `{"GetAllValidators":{}}`
    const resp = callStaking(calldata, true);
    if (resp.success > 0) {
        revert("could not get validators");
    }
    if (resp.data === "") return [];
    LoggerDebugExtended("GetAllValidators", ["data", resp.data])
    const result = JSON.parse<staking.QueryValidatorsResponse>(resp.data);
    return result.validators;
}

export function callStorage(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest("storage", calldata, BigInt.zero(), DEFAULT_GAS_TX, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function callStaking(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest("staking", calldata, BigInt.zero(), DEFAULT_GAS_TX, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function getCurrentValidator(): typestnd.ValidatorInfo {
    const currentState = getCurrentState();
    // TODO voting_power & proposer_priority
    return new typestnd.ValidatorInfo(currentState.validator_address, currentState.validator_pubkey, 0, 0);
}

export function checkValidatorsUpdate(validators: typestnd.ValidatorInfo[], validatorInfo: typestnd.ValidatorInfo, nodeId: i32): void {
    if (validators[nodeId].address != validatorInfo.address) {
        LoggerError("register node response has wrong validator address", ["expected", validatorInfo.address]);
        revert(`register node response has wrong validator address`)
    }
    if (validators[nodeId].pub_key != validatorInfo.pub_key) {
        LoggerError("register node response has wrong validator pub_key", ["expected", validatorInfo.pub_key]);
        revert(`register node response has wrong validator pub_key`)
    }
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


export function initChain(req: typestnd.InitChainSetup): void {
    LoggerDebug("start chain init", [])

    // TODO what are the correct empty value?
    const emptyBlockId = new typestnd.BlockID("", new typestnd.PartSetHeader(0, ""))
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
    );

    const valuestr = JSON.stringify<CurrentState>(currentState);
    LoggerDebug("set current state", ["state", valuestr])
    setCurrentState(currentState);
    setConsensusParams(cfg.LOG_START + 1, req.consensus_params);
    LoggerDebug("current state set", [])
}

// last log may be an uncommited one or a final one
export function getLastLog(): LogEntry {
    const index = getLastLogIndex();
    return getLogEntryObj(index);
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

export function isNodeValidator(genesisState: mctypes.GenesisState, ourPublicKey: string): IsNodeValidator {
    if (!genesisState.has(modnames.MODULE_GENUTIL)) {
        revert(`genesis state missing field: ${modnames.MODULE_GENUTIL}`)
    }
    const genutilGenesisStr = base64ToString(genesisState.get(modnames.MODULE_GENUTIL))
    const genutilGenesis = JSON.parse<mctypes.GenutilGenesis>(genutilGenesisStr)
    let weAreValidator = false;
    let currentNodeId = 0;
    for (let i = 0; i < genutilGenesis.gen_txs.length; i++) {
        const gentx = String.UTF8.decode(base64.decode(genutilGenesis.gen_txs[i]).buffer)
        const tx = JSON.parse<SignedTransaction>(gentx);
        const msg = stakingutils.extractCreateValidatorMsg(tx)
        if (msg == null) continue;
        const consKey = msg.pubkey
        if (consKey == null) continue;
        if (consKey.getKey().key == ourPublicKey) {
            weAreValidator = true;
            // NOTE: requires req.peers order is the same as gentx
            currentNodeId = i;
            break;
        }
    }
    if (genutilGenesis.gen_txs.length > 0) {
        return new IsNodeValidator(weAreValidator, currentNodeId)
    }

    // look into staking data
    if (!genesisState.has(modnames.MODULE_COSMOSMOD)) {
        revert(`genesis state missing field: ${modnames.MODULE_COSMOSMOD}`)
    }
    const cosmosmodGenesisStr = base64ToString(genesisState.get(modnames.MODULE_COSMOSMOD))
    const cosmosmodGenesis = JSON.parse<CosmosmodGenesisState>(cosmosmodGenesisStr)
    for (let i = 0; i < cosmosmodGenesis.staking.validators.length; i++) {
        const v = cosmosmodGenesis.staking.validators[i]
        const consKey = v.consensus_pubkey
        if (consKey == null) continue;
        if (consKey.getKey().key == ourPublicKey) {
            weAreValidator = true;
            // NOTE: requires req.peers order is the same as gentx
            currentNodeId = i;
            break;
        }
    }
    return new IsNodeValidator(weAreValidator, currentNodeId)
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
    const resp = callContract(contractRole, calldatastr, false, MODULE_NAME)
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`hooks failed`, ["error", resp.data])
    }
}

export function decodeTx(tx: Base64String): SignedTransaction {
    return wasmxw.decodeCosmosTxToJson(decodeBase64(tx).buffer);
}

// <address>@/ip4/127.0.0.1/tcp/5001/p2p/12D3KooWMWpac4Qp74N2SNkcYfbZf2AWHz7cjv69EM5kejbXwBZF
// TODO for raft GRPC upgrade the node address to be compatible with P2P
// TODO <address>@/ip4/127.0.0.1/tcp/5001/grpc/ID
// from 6efc12ab37fc0e096d8618872f6930df53972879@0.0.0.0:26757
// to mythos1..@/ip4/127.0.0.1/tcp/5001/grpc/6efc12ab37fc0e096d8618872f6930df53972879
export function parseNodeAddress(peeraddr: string): p2ptypes.NodeInfoResponse {
    const resp = new p2ptypes.NodeInfoResponse()
    const parts1 = peeraddr.split("@");
    if (parts1.length != 2) {
        resp.error = `invalid node format; found: ${peeraddr}`
        return resp;
    }
    // <address>@/ip4/127.0.0.1/tcp/5001/p2p/12D3KooWMWpac4Qp74N2SNkcYfbZf2AWHz7cjv69EM5kejbXwBZF
    const addr = parts1[0]
    const parts2 = parts1[1].split("/")
    if (parts2.length != 7) {
        resp.error = `invalid node format; found: ${peeraddr}`
        return resp;
    }
    const host = parts2[2]
    const port = parts2[4]
    const p2pid = parts2[6]
    resp.node_info = new NodeInfo(addr, new p2ptypes.NetworkNode(p2pid, host, port, parts1[1]), false);
    return resp;
}
