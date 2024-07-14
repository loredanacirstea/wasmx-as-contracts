import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly"
import { ActionParam, EventObject } from "xstate-fsm-as/assembly/types";
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as wasmxt from "wasmx-env/assembly/types";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as level0 from "wasmx-consensus/assembly/level0"
import * as mcutils from "wasmx-consensus/assembly/multichain_utils"
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { NodeInfo } from "wasmx-p2p/assembly/types";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import * as p2pw from "wasmx-p2p/assembly/p2p_wrap";
import * as tnd2utils from "wasmx-tendermint-p2p/assembly/action_utils";
import * as tnd2mc from "wasmx-tendermint-p2p/assembly/multichain";
import * as stakingutils from "wasmx-stake/assembly/msg_utils";
import * as wasmxdefaults from "wasmx-wasmx/assembly/defaults";
import * as utils from "wasmx-utils/assembly/utils";
import * as metaregstore from "wasmx-metaregistry/assembly/storage";
import * as metaregtypes from "wasmx-metaregistry/assembly/types";
import * as staking from "wasmx-stake/assembly/types";
import * as cfg from "./config";
import { addNewChainRequests, getChainIdLast, getChainSetupData, getNextLevel, getNewChainRequests, getNewChainResponse, getParams, getSubChainData, getValidatorsCount, setChainIdLast, setChainSetupData, setNewChainRequests, setNewChainResponse, setSubChainData, getCurrentLevel } from "./storage";
import { ChainConfigData, CurrentChainSetup, MODULE_NAME, MsgLastChainId, MsgNewChainAccepted, MsgNewChainGenesisData, MsgNewChainRequest, MsgNewChainResponse, PotentialValidator, PotentialValidatorWithSignature } from "./types";
import { getProtocolId, getTopic, getTopicLevel, getTopicLobby, getTopicNewChain, mergeValidators, signMessage, sortValidators, sortValidatorsSimple, unwrapValidators, wrapValidators } from "./actions_utils";
import { LoggerDebug, LoggerError, LoggerInfo, revert } from "./utils";
import { ChainConfig, ChainId, InitSubChainDeterministicRequest, NodePorts } from "wasmx-consensus/assembly/types_multichain";
import * as mcregistry from "wasmx-multichain-registry/assembly/actions";
import { BigInt } from "wasmx-env/assembly/bn";
import { Bech32String } from "wasmx-env/assembly/types";
import * as wasmxtypes from "wasmx-wasmx/assembly/types";
import { Params, RegisterDefaultSubChainRequest, SubChainData } from "wasmx-multichain-registry/assembly/types";
import { QueryBuildGenTxRequest } from "wasmx-tendermint-p2p/assembly/types";
import { base64ToString } from "wasmx-utils/assembly/utils";
import * as roles from "wasmx-env/assembly/roles";

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

export function ifLobbyDisconnect(
    params: ActionParam[],
    event: EventObject,
): boolean {
    // TODO!!
    // maybe disconnect lobby if chainid < lastchainid + 10
    return false;
}

export function ifValidatorThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const data = getNewChainResponse();
    if (data == null) return false;
    if (data.signatures.length < getValidatorsCount()) return false;
    if (data.signatures.length != data.msg.validators.length) return false;
    for (let i = 0; i < data.signatures.length; i++) {
        if (data.signatures[i] == "") return false;
    }
    return true;
}

export function ifGenesisDataComplete(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const data = getNewChainResponse();
    if (data == null) {
        return false;
    }
    if (data.signatures.length < getValidatorsCount()) return false;
    const chaindata = getSubChainData()
    if (chaindata == null) {
        return false;
    }
    if (chaindata.data.genTxs.length < data.signatures.length) return false;
    // check empty signatures
    for (let i = 0; i < data.signatures.length; i++) {
        if (data.signatures[i] == "") {
            return false
        }
        if (chaindata.data.genTxs[i] == "") {
            return false
        }
    }
    return true;
}

export function ifIncludesUs(
    params: ActionParam[],
    event: EventObject,
): boolean {
    const state = getChainSetupData()
    if (state == null) {
        revert(`no setup data`)
        return false;
    }

    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("msg")) {
        revert("no MsgNewChainResponse msg found");
    }
    if (!ctx.has("signature")) {
        revert("no MsgNewChainResponse signature found");
    }
    const msgstr = base64ToString(ctx.get("msg"))
    const newdata = JSON.parse<MsgNewChainResponse>(msgstr)

    for (let i = 0; i < newdata.msg.validators.length; i++) {
        const v = newdata.msg.validators[i]
        if (v.consensusPublicKey == state.data.validator_pubkey) {
            return true;
        }
    }
    return false;
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

    const datajson = String.UTF8.decode(base64.decode(initChainSetup).buffer);
    // TODO remove validator private key from logs in initChainSetup
    LoggerDebug("setupNode", ["initChainSetup", datajson])
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
    setChainSetupData(new CurrentChainSetup(data, peers[data.node_index]))
}

export function connectNode(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    const protocolId = getProtocolId()

    const reqstart = new p2ptypes.StartNodeWithIdentityRequest(state.node.node.port, protocolId, state.data.validator_privkey);
    const resp = p2pw.StartNodeWithIdentity(reqstart);
    if (resp.error != "") {
        revert(`start node with identity: ${resp.error}`)
    }
}

export function p2pConnectLobbyRoom(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    const protocolId = getProtocolId()
    const topic = getTopicLobby()
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(protocolId, topic))
}

export function p2pConnectNewChainRoom(
    params: ActionParam[],
    event: EventObject,
): void {
    const data = getNewChainResponse()
    if (data == null) {
        revert(`no temporary chain data`)
        return;
    }
    const protocolId = getProtocolId()
    const topic = getTopicNewChain(data.msg.chainId.full)
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(protocolId, topic))
}

export function p2pDisconnectLobbyRoom(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    const protocolId = getProtocolId()
    const topic = getTopicLobby()
    p2pw.DisconnectChatRoom(new p2ptypes.DisconnectChatRoomRequest(protocolId, topic))
}

export function p2pDisconnectNewChainRoom(
    params: ActionParam[],
    event: EventObject,
): void {
    const data = getNewChainResponse()
    if (data == null) {
        revert(`no temporary chain data`)
        return;
    }
    const protocolId = getProtocolId()
    const topic = getTopicNewChain(data.msg.chainId.full)
    p2pw.DisconnectChatRoom(new p2ptypes.DisconnectChatRoomRequest(protocolId, topic))
}

export function sendNewChainRequest(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }

    // TODO move this check to diagram
    // we only allow the first validator of a level to validate for the next level
    const cansend = isFirstValidator(state);
    if (!cansend) return;

    const data = new MsgNewChainRequest(getNextLevel(), getOurValidatorData(state))
    const signeddata = prepareNewChainRequest(data, state.data.validator_privkey);
    const contract = wasmxw.getAddress();
    const protocolId = getProtocolId()
    const topic = getTopicLobby()
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, signeddata, protocolId, topic))
}

export function sendLastChainId(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    sendLastChainIdInternal(state, getChainIdLast())
}

export function sendLastChainIdInternal(state: CurrentChainSetup, chainId: ChainId): void {
    const signeddata = prepareMsgLastChainId(new MsgLastChainId(chainId), state.data.validator_privkey);
    const contract = wasmxw.getAddress();
    const protocolId = getProtocolId()
    const topic = getTopicLobby()
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, signeddata, protocolId, topic))
}

export function sendLastNodeId(
    params: ActionParam[],
    event: EventObject,
): void {
    // const state = getChainSetupData()
    // if (state == null) {
    //     revert(`setup state not stored`)
    //     return;
    // }
    // const data = buildMsgLastNodeId();
    // const signeddata = prepareMsgLastNodeId(data);
    // const contract = wasmxw.getAddress();
    // const protocolId = getProtocolId()
    // const topic = getTopicLobby()
    // p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, signeddata, protocolId, topic))
}

export function receiveLastChainId(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("msg")) {
        revert("no chain id found");
    }
    if (!ctx.has("signature")) {
        revert("no chain signature found");
    }
    const msgstr = base64ToString(ctx.get("msg"))
    LoggerDebug("receiveLastChainId", ["msg", msgstr])
    const msg = JSON.parse<MsgLastChainId>(msgstr)
    const signature = ctx.get("signature")
    // TODO check signature!!
    // TODO add public key in message, to check signature & check public key against a list of trusted keys

    // update last known chainid
    const lastid = getChainIdLast()
    const nextIndex = getNextLevel()
    if (nextIndex != msg.id.level) return;
    if (lastid.evmid < msg.id.evmid) {
        setChainIdLast(msg.id)
    }
}

export function receiveLastNodeId(
    params: ActionParam[],
    event: EventObject,
): void {

}

// receive a chain request from another node
// we only handle this if we are in negotiating phase & we need additional validators
export function receiveNewChainRequest(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("msg")) {
        revert("no MsgNewChainRequest msg found");
    }
    if (!ctx.has("signature")) {
        revert("no MsgNewChainRequest signature found");
    }
    const msgstr = base64ToString(ctx.get("msg"))
    LoggerDebug("receiveNewChainRequest", ["msg", msgstr])
    const data = JSON.parse<MsgNewChainRequest>(msgstr)
    const signature = ctx.get("signature")
    // TODO check signature!!

    if (data.level != getNextLevel()) return;

    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    const cansend = isFirstValidator(state);
    if (!cansend) return;

    LoggerInfo("processing receiveNewChainRequest", ["msg", msgstr])

    const tempdata = getNewChainResponse()

    // if we don't have temporary chain data, then we just store the requests for when we will have
    if (tempdata == null) {
        addNewChainRequests(data);
        LoggerInfo("empty new chain response, added new chain request", ["msg", msgstr])
        return;
    }

    // if our set of validators is filled, don't respond
    if (tempdata.msg.validators.length >= getValidatorsCount()) return;

    // we add this validator to our set and add an empty signature for now.
    tempdata.msg.validators.push(data.validator);
    // push empty signature, the node will fill it in
    tempdata.signatures.push("");

    // sort validators alphabetically
    const allvalid = sortValidators(wrapValidators(tempdata.msg.validators, tempdata.signatures))
    const newtempdata = unwrapValidators(tempdata, allvalid)

    setNewChainResponse(newtempdata);
    LoggerInfo("update new chain response", ["msg", JSON.stringify<MsgNewChainResponse>(newtempdata)])
}

// we have not received data from other nodes, so we are creating
// our own chain, waiting for other validators to join
export function createNewChainResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`no setup data`)
        return;
    }
    const validator = getOurValidatorData(state)
    const lastChainId = getChainIdLast()
    const levelIndex = getNextLevel()
    const chainBaseName = mcregistry.getChainBaseNameSubChainLevel(levelIndex)
    const chainId = new ChainId("", chainBaseName, levelIndex, lastChainId.evmid + 1, 1)

    let vcount = getValidatorsCount()
    let allreqs = getNewChainRequests()
    const reqs = allreqs.slice(0, vcount - 1)
    LoggerInfo("create new chain response", ["chain_id", chainId.full, "all_requests_count", allreqs.length.toString(), "selected_requests", JSON.stringify<MsgNewChainRequest[]>(reqs)])

    const count = reqs.length + 1
    LoggerInfo("create new chain response", ["chain_id", chainId.full, "min_validator_count", vcount.toString(), "validators", count.toString()])

    let validators = new Array<PotentialValidator>(count)
    const signatures = new Array<string>(count)
    validators[0] = validator;
    signatures[0] = "";
    for (let i = 0; i < reqs.length; i++) {
        validators[i+1] = reqs[i].validator
        signatures[i+1] = "";
    }
    validators = sortValidatorsSimple(validators)
    let ourindex = 0;
    for (let i = 0; i < validators.length; i++) {
        if (validators[i].consensusPublicKey == state.data.validator_pubkey) {
            ourindex = i;
        }
    }

    const msg = new MsgNewChainAccepted(getNextLevel(), chainId, validators)
    const datastr = JSON.stringify<MsgNewChainAccepted>(msg)
    const signature = signMessage(state.data.validator_privkey, datastr);
    signatures[ourindex] = signature
    const data = new MsgNewChainResponse(msg, signatures)
    setNewChainResponse(data);
    // empty requests
    setNewChainRequests([]);
}

// send our temporary new chain data to others
export function sendNewChainResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`no setup data`)
        return;
    }

    const data = getNewChainResponse()
    if (data == null) {
        revert(`no temporary chain data`)
        return;
    }
    // we send this tempdata as MsgNewChainResponse
    sendNewChainResponseInternal(state, data);
}

// we receive temporary new chain data from others
export function receiveNewChainResponse(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("msg")) {
        revert("no MsgNewChainResponse msg found");
    }
    if (!ctx.has("signature")) {
        revert("no MsgNewChainResponse signature found");
    }
    const msgstr = base64ToString(ctx.get("msg"))
    LoggerDebug("receiveNewChainResponse", ["msg", msgstr])
    const newdata = JSON.parse<MsgNewChainResponse>(msgstr)
    const signature = ctx.get("signature")
    // TODO check signature!!

    if (newdata.msg.level != getNextLevel()) return;

    const state = getChainSetupData()
    if (state == null) {
        revert(`no setup data`)
        return;
    }

    let ourindex = 0
    for (let i = 0; i < newdata.msg.validators.length; i++) {
        const v = newdata.msg.validators[i]
        if (v.consensusPublicKey == state.data.validator_pubkey) {
            ourindex = i
        }
    }

    const tempdata = getNewChainResponse()
    // if we got here, it means we are among the validators in this data
    // if we don't have already temporary newchain data, we just need to sign it & resend
    // if we have temporary data that only contains us as validator, we replace it
    if (
        tempdata == null ||
        (tempdata.msg.validators.length == 1 && newdata.msg.validators.length > 1)
    ) {
        const datastr = JSON.stringify<MsgNewChainAccepted>(newdata.msg)
        const signature = signMessage(state.data.validator_privkey, datastr);
        newdata.signatures[ourindex] = signature;
        setNewChainResponse(newdata);
        sendNewChainResponseInternal(state, newdata);
        return;
    }

    if (newdata.msg.chainId.full != tempdata.msg.chainId.full) return;
    if (newdata.msg.validators.length != newdata.signatures.length) return;

    // we check our signature
    if (newdata.signatures.length == tempdata.signatures.length && newdata.signatures[ourindex] != tempdata.signatures[ourindex]) {
        LoggerError("received unauthorized NewChainResponse", ["subchain_id", newdata.msg.chainId.full])
    }

    // messages may contain additional signatures
    let count = newdata.msg.validators.length
    if (count > tempdata.msg.validators.length) {
        count = tempdata.msg.validators.length
    }
    for (let i = 0; i < count; i++) {
        if (newdata.msg.validators[i].consensusPublicKey == tempdata.msg.validators[i].consensusPublicKey && tempdata.signatures[i] == "") {
            tempdata.signatures[i] = newdata.signatures[i]
        }
    }

    // if we receive other validators than we chose,
    // we alphabetically order & them & select 3 (or our min-validator number)

    let allvalid = sortValidators(mergeValidators(
        wrapValidators(tempdata.msg.validators, tempdata.signatures),
        wrapValidators(newdata.msg.validators, newdata.signatures),
    ))
    allvalid = allvalid.slice(0, getValidatorsCount())

    const newtempdata = unwrapValidators(tempdata, allvalid)
    setNewChainResponse(newtempdata);
    LoggerInfo("update new chain response", ["msg", JSON.stringify<MsgNewChainResponse>(newtempdata)])
}

export function tryCreateNewChainGenesisData(
    params: ActionParam[],
    event: EventObject,
): void {
    // if we are the first validator in the list, we create the genesis data
    const tempdata = getNewChainResponse()
    if (tempdata == null) {
        revert(`no new chain data`)
        return;
    }
    const state = getChainSetupData()
    if (state == null) {
        revert(`no setup data`)
        return;
    }
    if (tempdata.msg.validators[0].consensusPublicKey != state.data.validator_pubkey) {
        LoggerInfo("not proposing genesis data, not the first validator", ["subchain_id", tempdata.msg.chainId.full, "proposer", tempdata.msg.validators[0].consensusPublicKey, "validator", state.data.validator_pubkey])
        return;
    }
    LoggerInfo("proposing genesis data, as the first validator", ["subchain_id", tempdata.msg.chainId.full, "proposer", tempdata.msg.validators[0].consensusPublicKey, "validator", state.data.validator_pubkey])
    createNewChainGenesisData(tempdata, state)
}

export function createNewChainGenesisData(chaindata: MsgNewChainResponse, state: CurrentChainSetup): void {
    const levelIndex = getNextLevel()
    const params = getParams()
    const chainId = chaindata.msg.chainId
    const validCount = chaindata.msg.validators.length
    const denomUnit = `lvl${levelIndex}`
    const req = new RegisterDefaultSubChainRequest(denomUnit, 18, chainId.base_name, levelIndex, params.level_initial_balance, [])
    const chainConfig = mcutils.buildChainConfig(req.denom_unit, req.base_denom_unit, req.chain_base_name)

    // create new genesis data
    const wasmxContractState = new Map<Bech32String,wasmxtypes.ContractStorage[]>()

    // store common configuration now
    // additional config is set by each validator
    // TODO lobby - check that only metaregistry contract has wasmxstate set separately by each validator
    const registryContractState = new Array<wasmxtypes.ContractStorage>(0)

    // store level0 config - TODO chainID may change
    const level0Config = new wasmxtypes.ContractStorage(
        utils.uint8ArrayToHex(Uint8Array.wrap(String.UTF8.encode(metaregstore.getDataKey(level0.Level0ChainIdFull)))),
        utils.stringToBase64(JSON.stringify<metaregtypes.ChainConfigData>(new metaregtypes.ChainConfigData(level0.Level0Config, level0.Level0ChainId))),
    )
    registryContractState.push(level0Config)

    // store newchain config in its metaregistry contract
    const newChainConfig = new wasmxtypes.ContractStorage(
        utils.uint8ArrayToHex(Uint8Array.wrap(String.UTF8.encode(metaregstore.getDataKey(chainId.full)))),
        utils.stringToBase64(JSON.stringify<metaregtypes.ChainConfigData>(new metaregtypes.ChainConfigData(chainConfig, chainId))),
    )
    registryContractState.push(newChainConfig)
    // the parent chains are added when signing gentxs
    wasmxContractState.set(wasmxdefaults.ADDR_METAREGISTRY, registryContractState)

    const regparams = new Params(params.min_validators_count, params.enable_eid_check, params.erc20CodeId, params.derc20CodeId, params.level_initial_balance)
    const data = mcregistry.buildDefaultSubChainGenesisInternal(regparams, chainId.full, levelIndex, chainConfig, req, wasmxContractState,  new NodePorts())
    data.peers = new Array<string>(validCount)
    const genTx = new Array<string>(validCount)
    for (let i = 0; i < validCount; i++) {
        data.peers[i] = ""
        genTx[i] = ""
    }

    const subchaindata = new SubChainData(data, genTx, params.level_initial_balance, levelIndex)

    const reqstr = JSON.stringify<InitSubChainDeterministicRequest>(subchaindata.data);
    const signature = signMessage(state.data.validator_privkey, reqstr);
    const signatures = new Array<string>(validCount)
    for (let i = 0; i < signatures.length; i++) {
        signatures[i] = ""
        if (chaindata.msg.validators[i].consensusPublicKey == state.data.validator_pubkey) {
            signatures[i] = signature
        }
    }
    const gendata = new MsgNewChainGenesisData(subchaindata, chaindata.msg.validators, signatures)
    setSubChainData(gendata)

    // TODO event that this user should create genTx
    LoggerInfo("genesis data created", ["subchain_id", chainId.full])
    // send this data to the network
    sendNewChainGenesisDataInternal(gendata, state)
}

export function getOurValidatorData(state: CurrentChainSetup): PotentialValidator {
    const addressBytes = base64.encode(Uint8Array.wrap(wasmxw.addr_canonicalize(state.node.address)))
    return new PotentialValidator(state.node.node, addressBytes, state.data.validator_pubkey)
}

export function sendNewChainGenesisData(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    const gendata = getSubChainData()
    if (gendata == null) {
        revert(`genesis data not stored`)
        return;
    }
    sendNewChainGenesisDataInternal(gendata, state);
}

export function receiveNewChainGenesisData(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("msg")) {
        revert("no MsgNewChainGenesisData msg found");
    }
    if (!ctx.has("signature")) {
        revert("no MsgNewChainGenesisData signature found");
    }
    const msgstr = base64ToString(ctx.get("msg"))
    LoggerDebug("receiveNewChainGenesisData", ["msg", msgstr])
    const data = JSON.parse<MsgNewChainGenesisData>(msgstr)
    // const signature = ctx.get("signature")
    // we don't need signature, it is contained in the genesis data
    // TODO check genesisTx signatures

    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }

    let ourindex = 0;
    for (let i = 0; i < data.validators.length; i++) {
        if (data.validators[i].consensusPublicKey == state.data.validator_pubkey) {
            ourindex = i;
        }
    }

    const oldData = getSubChainData()
    if (oldData != null) {
        // TODO check our signature is good if we received an updated version
        // check that genesis data is unchanged
        // TODO maybe introduce a message only for gentxs, so we do not resend genesis data

        // return if genesis data is old
        if (oldData.signatures.length > data.signatures.length) return;
        if (oldData.data.genTxs.length > data.data.genTxs.length) return;
        if (oldData.data.data.peers.length > data.data.data.peers.length) return;

        // TODO if same number validators
        // if (oldData.data.data.peers[ourindex] != data.data.data.peers[ourindex]) {
        //     revert(`peer mismatch: expected ${oldData.data.data.peers[ourindex]}, found ${data.data.data.peers[ourindex]}`)
        // }
        // if (oldData.signatures[ourindex] != data.signatures[ourindex]) {
        //     revert(`signature mismatch: expected ${oldData.signatures[ourindex]}, found ${data.signatures[ourindex]}`)
        // }
        // if (oldData.data.genTxs[ourindex] != data.data.genTxs[ourindex]) {
        //     revert(`genTx mismatch: expected ${oldData.data.genTxs[ourindex]}, found ${data.data.genTxs[ourindex]}`)
        // }

        LoggerInfo("genesis data received", ["subchain_id", data.data.data.init_chain_request.chain_id])
    } else {
        LoggerInfo("genesis data received", ["subchain_id", data.data.data.init_chain_request.chain_id])

        if (data.signatures[ourindex] == "") {
            // we need to add our signature on the genesis data
            const datastr = JSON.stringify<InitSubChainDeterministicRequest>(data.data.data)
            const signature = signMessage(state.data.validator_privkey, datastr);
            data.signatures[ourindex] = signature;

            // we send the new message after we sign the genesis tx for the validator
            // sendNewChainGenesisDataInternal(data, state)
        }
        // TODO create genTx
    }

    // store new data
    setSubChainData(data)
}

export function initializeChain(
    params: ActionParam[],
    event: EventObject,
): void {
    const gendata = getSubChainData()
    if (gendata == null) {
        revert(`genesis data not stored`)
        return;
    }
    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }

    const chaindata = mcregistry.initSubChainPrepareData(gendata.data, gendata.data.genTxs, getValidatorsCount())

    // send new chainid to the network
    const chainIdFull = gendata.data.data.init_chain_request.chain_id
    const chainId = ChainId.fromString(chainIdFull)
    setChainIdLast(chainId)
    sendLastChainIdInternal(state, chainId)

    // initSubChain will initialize the chain & send the chain data to be registered on level0, on metaregistry & the local registry
    tnd2utils.initSubChain(
        chaindata.data,
        state.data.validator_pubkey,
        state.data.validator_address,
        state.data.validator_privkey,
    )
}

export function addGenTx(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("gentx")) {
        revert("no message found");
    }
    const gentx = ctx.get("gentx") // base64
    let genTxStr = String.UTF8.decode(base64.decode(gentx).buffer)
    const tx = JSON.parse<wasmxt.SignedTransaction>(genTxStr)
    const msg = stakingutils.extractCreateValidatorMsg(tx)
    if (msg == null) {
        revert(`invalid gentx: does not contain MsgCreateValidator`);
        return;
    }
    // TODO fix me?
    // const caller = wasmxw.getCaller();
    // if (!wasmxw.addr_equivalent(caller, msg.validator_address)) {
    //     revert(`unauthorized: caller ${caller}, validator ${msg.validator_address}`)
    // }

    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    const gendata = getSubChainData()
    if (gendata == null) {
        revert(`genesis data not stored`)
        return;
    }
    for (let i = 0; i < gendata.validators.length; i++) {
        if (gendata.validators[i].consensusPublicKey == state.data.validator_pubkey) {
            gendata.data.genTxs[i] = gentx
            // we add the peer from the tx memo
            gendata.data.data.peers[i] = tx.body.memo

            LoggerInfo("added gentx", ["subchain_id", gendata.data.data.init_chain_request.chain_id, "peer", tx.body.memo])
        }
    }
    // already added
    // gendata.signatures[i] = signature

    const chainId = wasmxw.getChainId()
    if (!chainId.includes(level0.Level0ChainId.base_name)) {
        // also add our chain configuration to the wasmx genesis metaregistry
        let metaregState = new Array<wasmxtypes.ContractStorage>(0)
        if (gendata.data.wasmxContractState.has(wasmxdefaults.ADDR_METAREGISTRY)) {
            metaregState = gendata.data.wasmxContractState.get(wasmxdefaults.ADDR_METAREGISTRY)
        }

        // duplicates are removed by merging the state
        const newMetaregState = new Array<wasmxtypes.ContractStorage>(0)
        const parentConfig = getChainConfigFromMetaregistry(chainId)
        if (parentConfig != null) {
            const parentconfigst = new wasmxtypes.ContractStorage(
                utils.uint8ArrayToHex(Uint8Array.wrap(String.UTF8.encode(metaregstore.getDataKey(chainId)))),
                utils.stringToBase64(JSON.stringify<metaregtypes.ChainConfigData>(parentConfig)),
            )
            newMetaregState.push(parentconfigst)
        }

        metaregState = mcregistry.mergeWasmxState(metaregState, newMetaregState)
        gendata.data.wasmxContractState.set(wasmxdefaults.ADDR_METAREGISTRY, metaregState)
    }

    setSubChainData(gendata)
    sendNewChainGenesisDataInternal(gendata, state)
}

export function getGenesisData(
    params: ActionParam[],
    event: EventObject,
): void {
    const gendata = getSubChainData()
    if (gendata == null) {
        wasmx.setFinishData(new ArrayBuffer(0))
        return;
    }
    const resp = String.UTF8.encode(JSON.stringify<MsgNewChainGenesisData>(gendata))
    wasmx.setFinishData(resp)
}

export function getConfigData(
    params: ActionParam[],
    event: EventObject,
): void {
    const gendata = getSubChainData()
    if (gendata == null) {
        wasmx.setFinishData(new ArrayBuffer(0))
        return;
    }
    const resp = String.UTF8.encode(JSON.stringify<ChainConfigData>(new ChainConfigData(gendata.data.data.init_chain_request.chain_id, gendata.data.data.chain_config)))
    wasmx.setFinishData(resp)
}

export function buildGenTx(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("message")) {
        revert("no message found");
    }
    const msgstr = ctx.get("message") // stringified message
    const req = JSON.parse<QueryBuildGenTxRequest>(msgstr);

    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    const gendata = getSubChainData()
    if (gendata == null) {
        revert(`genesis data not stored`)
        return;
    }

    const genTx = tnd2mc.createGenTx(
        state.node,
        gendata.data.data.chain_config.Bech32PrefixAccAddr,
        gendata.data.data.chain_config.BondBaseDenom,
        req.msg,
    )
    if (genTx == null) {
        revert(`genTx is null`)
        return;
    }
    const resp = String.UTF8.encode(JSON.stringify<wasmxt.SignedTransaction>(genTx))
    wasmx.setFinishData(resp)
}

export function sendNewChainGenesisDataInternal(gendata: MsgNewChainGenesisData, state: CurrentChainSetup): void {
    const signeddata = prepareMsgNewChainGenesisData(gendata, state.data.validator_privkey);
    const contract = wasmxw.getAddress();
    const protocolId = getProtocolId()
    const topic = getTopicNewChain(gendata.data.data.init_chain_request.chain_id)
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, signeddata, protocolId, topic))
}

export function prepareMsgLastChainId(data: MsgLastChainId, privKey: string): string {
    const datastr = JSON.stringify<MsgLastChainId>(data);
    const signature = signMessage(privKey, datastr);
    const dataBase64 = base64.encode(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveLastChainId","params":[{"key":"msg","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    LoggerDebug("prepare request", ["msg", msgstr])
    return msgstr
}

export function prepareNewChainRequest(data: MsgNewChainRequest, privKey: string): string {
    const datastr = JSON.stringify<MsgNewChainRequest>(data);
    const signature = signMessage(privKey, datastr);
    const dataBase64 = base64.encode(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveNewChainRequest","params":[{"key":"msg","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    LoggerDebug("prepare request", ["msg", msgstr])
    return msgstr
}

export function prepareNewChainResponse(data: MsgNewChainResponse, privKey: string): string {
    const datastr = JSON.stringify<MsgNewChainResponse>(data);
    const signature = signMessage(privKey, datastr);
    const dataBase64 = base64.encode(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveNewChainResponse","params":[{"key":"msg","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    LoggerDebug("prepare request", ["msg", msgstr])
    return msgstr
}

export function prepareMsgNewChainGenesisData(data: MsgNewChainGenesisData, privKey: string): string {
    const datastr = JSON.stringify<MsgNewChainGenesisData>(data);
    const signature = signMessage(privKey, datastr);
    const dataBase64 = base64.encode(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveNewChainGenesisData","params":[{"key":"msg","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    LoggerDebug("prepare request", ["msg", msgstr])
    return msgstr
}

export function sendNewChainResponseInternal(state: CurrentChainSetup, data: MsgNewChainResponse): void {
    const signeddata = prepareNewChainResponse(data, state.data.validator_privkey);
    const contract = wasmxw.getAddress();
    const protocolId = getProtocolId()
    const topic = getTopicLobby()
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, signeddata, protocolId, topic))
}

export function isFirstValidator(state: CurrentChainSetup): boolean {
    const validators = getAllValidatorInfos();
    if (validators.length < 2) return true;

    const pubkey = validators[0].consensus_pubkey
    if (pubkey == null) return false;
    if (pubkey.getKey().key == state.data.validator_pubkey) return true;
    return false
}

export function getAllValidatorInfos(): staking.ValidatorSimple[] {
    const calldata = `{"GetAllValidatorInfos":{}}`
    const resp = callContract(roles.ROLE_STAKING, calldata, true);
    if (resp.success > 0) {
        revert("could not get validators");
    }
    if (resp.data === "") return [];
    LoggerDebug("GetAllValidatorInfos", ["data", resp.data])
    const result = JSON.parse<staking.QueryValidatorInfosResponse>(resp.data);
    return result.validators;
}

export function getChainConfigFromMetaregistry(chainId: string): metaregtypes.ChainConfigData | null {
    const calldatastr = `{"GetChainData":{"chain_id":"${chainId}"}}`;
    const resp = callContract(roles.ROLE_METAREGISTRY, calldatastr, true);
    if (resp.success > 0) {
        return null;
    }
    const response = JSON.parse<metaregtypes.MsgSetChainDataRequest>(resp.data);
    return response.data
}

export function callContract(addr: Bech32String, calldata: string, isQuery: boolean): wasmxt.CallResponse {
    const req = new wasmxt.CallRequest(addr, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = utils.base64ToString(resp.data);
    return resp;
}
