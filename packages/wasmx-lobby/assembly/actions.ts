import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly"
import { ActionParam, EventObject } from "xstate-fsm-as/assembly/types";
import { getParamsOrEventParams, actionParamsToMap } from 'xstate-fsm-as/assembly/utils';
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as wasmxt from "wasmx-env/assembly/types";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { NodeInfo } from "wasmx-p2p/assembly/types";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import * as p2pw from "wasmx-p2p/assembly/p2p_wrap";
import * as tnd2utils from "wasmx-tendermint-p2p/assembly/action_utils";
import * as tnd2mc from "wasmx-tendermint-p2p/assembly/multichain";
import * as cfg from "./config";
import { getChainIdLast, getChainSetupData, getCurrentLevel, getNewChainResponse, getParams, getSubChainData, getValidatorsCount, setChainIdLast, setChainSetupData, setNewChainResponse, setSubChainData } from "./storage";
import { CurrentChainSetup, MsgLastChainId, MsgNewChainAccepted, MsgNewChainGenesisData, MsgNewChainRequest, MsgNewChainResponse, PotentialValidator } from "./types";
import { getProtocolId, getTopic, mergeValidators, signMessage, sortValidators, wrapValidators } from "./actions_utils";
import { LoggerDebug, LoggerInfo, revert } from "./utils";
import { ChainId, InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import * as mcregistry from "wasmx-multichain-registry/assembly/actions";
import { BigInt } from "wasmx-env/assembly/bn";
import { Bech32String } from "wasmx-env/assembly/types";
import * as wasmxtypes from "wasmx-wasmx/assembly/types";
import { RegisterDefaultSubChainRequest, SubChainData } from "wasmx-multichain-registry/assembly/types";
import { buildChainId, parseChainId } from "wasmx-consensus/assembly/multichain_utils";
import { QueryBuildGenTxRequest } from "wasmx-tendermint-p2p/assembly/types";
import { base64ToString } from "wasmx-utils/assembly/utils";

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
    }
    return true;
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

export function p2pConnectLobbyRoom(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    const protocolId = getProtocolId(state.data.chain_id)
    const topic = getTopic(state.data.chain_id, cfg.ROOM_LOBBY)
    p2pw.ConnectChatRoom(new p2ptypes.ConnectChatRoomRequest(protocolId, topic))
}

export function p2pConnectNewChainRoom(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    const protocolId = getProtocolId(state.data.chain_id)
    const topic = getTopic(state.data.chain_id, cfg.ROOM_NEW_CHAIN)
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
    const protocolId = getProtocolId(state.data.chain_id)
    const topic = getTopic(state.data.chain_id, cfg.ROOM_LOBBY)
    p2pw.DisconnectChatRoom(new p2ptypes.DisconnectChatRoomRequest(protocolId, topic))
}

export function p2pDisconnectNewChainRoom(
    params: ActionParam[],
    event: EventObject,
): void {
    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }
    const protocolId = getProtocolId(state.data.chain_id)
    const topic = getTopic(state.data.chain_id, cfg.ROOM_NEW_CHAIN)
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

    const data = new MsgNewChainRequest(getCurrentLevel(), getOurValidatorData(state))
    const signeddata = prepareNewChainRequest(data, state.data.validator_privkey);
    const contract = wasmxw.getAddress();
    const protocolId = getProtocolId(state.data.chain_id)
    const topic = getTopic(state.data.chain_id, cfg.ROOM_LOBBY)
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
    const protocolId = getProtocolId(state.data.chain_id)
    const topic = getTopic(state.data.chain_id, cfg.ROOM_LOBBY)
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
    // const protocolId = getProtocolId(state.data.chain_id)
    // const topic = getTopic(state.data.chain_id, cfg.ROOM_LOBBY)
    // p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, signeddata, protocolId, topic))
}

export function receiveLastChainId(
    params: ActionParam[],
    event: EventObject,
): void {
    const p = getParamsOrEventParams(params, event);
    const ctx = actionParamsToMap(p);
    if (!ctx.has("id")) {
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
    if (lastid.level != msg.id.level) return;
    if (lastid.evmid < msg.id.evmid) {
        setChainIdLast(msg.id)
    }
}

export function receiveLastNodeId(
    params: ActionParam[],
    event: EventObject,
): void {

}

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

    // check if our set of validators is filled, if not send a response
    const tempdata = getNewChainResponse()
    if (tempdata == null) return;
    if (data.level != tempdata.msg.level) return;
    if (tempdata.msg.validators.length >= getValidatorsCount()) return;

    // we add this validator to our set and add an empty signature for now.
    tempdata.msg.validators.push(data.validator);
    tempdata.signatures.push("");
    setNewChainResponse(tempdata);

    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }

    // we send this tempdata as MsgNewChainResponse
    sendNewChainResponseInternal(state, tempdata);
}

// this is a new chain response, that we are creating
export function sendNewChainResponse(
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
    const levelIndex = getCurrentLevel()
    const chainBaseName = mcregistry.getChainBaseNameSubChainLevel(levelIndex)
    const chainId = new ChainId("", chainBaseName, levelIndex, lastChainId.evmid + 1, 1)
    chainId.full = buildChainId(chainId.base_name, chainId.level, chainId.evmid, chainId.fork_index)

    const msg = new MsgNewChainAccepted(getCurrentLevel(), chainId, [validator])
    const datastr = JSON.stringify<MsgNewChainAccepted>(msg)
    const signature = signMessage(state.data.validator_privkey, datastr);
    const data = new MsgNewChainResponse(msg, [signature])

    setNewChainResponse(data);
    // we send this tempdata as MsgNewChainResponse
    sendNewChainResponseInternal(state, data);
}

// may be our first message or not
export function receiveNewChainResponse(
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
    LoggerDebug("receiveNewChainResponse", ["msg", msgstr])
    const newdata = JSON.parse<MsgNewChainResponse>(msgstr)
    const signature = ctx.get("signature")
    // TODO check signature!!

    const tempdata = getNewChainResponse()
    if (tempdata == null) {
        setNewChainResponse(newdata);
        return;
    }
    if (newdata.msg.level != tempdata.msg.level) return;
    if (newdata.msg.chainId != tempdata.msg.chainId) return;
    if (newdata.msg.validators.length != newdata.signatures.length) return;

    // TODO check newdata signatures!

    // if we receve other validators than we chose,
    // we alphabetically order & them & select 3 (or our min-validator number)
    // check validators.length == signatures.length
    // each signature is on all validators

    let allvalid = sortValidators(mergeValidators(
        wrapValidators(tempdata.msg.validators, tempdata.signatures),
        wrapValidators(newdata.msg.validators, newdata.signatures),
    ))
    allvalid = allvalid.slice(0, getValidatorsCount())

    tempdata.msg.validators = new Array<PotentialValidator>(allvalid.length)
    tempdata.signatures = new Array<string>(allvalid.length)
    for (let i = 0; i < allvalid.length; i++) {
        tempdata.msg.validators[i] = allvalid[i].validator
        tempdata.signatures[i] = allvalid[i].signature
    }
    setNewChainResponse(tempdata);
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
    if (tempdata.msg.validators[0].consensusPublicKey != state.data.validator_pubkey) return;
    createNewChainGenesisData(tempdata, state)
}

export function createNewChainGenesisData(tempdata: MsgNewChainResponse, state: CurrentChainSetup): void {
    const levelIndex = getCurrentLevel()
    const params = getParams()
    const chaindata = getNewChainResponse()
    if (chaindata == null) {
        return revert(`no NewChainResponse data found`)
    }
    const chainId = chaindata.msg.chainId

    // create new genesis data
    const wasmxContractState = new Map<Bech32String,wasmxtypes.ContractStorage[]>()

    const denomUnit = `lvl${levelIndex}`
    const req = new RegisterDefaultSubChainRequest(denomUnit, 18, chainId.base_name, levelIndex, params.level_initial_balance, [])

    const data = mcregistry.buildDefaultSubChainGenesisInternal(params, chainId.full, req, wasmxContractState)
    const subchaindata = new SubChainData(data, [], params.level_initial_balance, levelIndex)

    const reqstr = JSON.stringify<InitSubChainDeterministicRequest>(subchaindata.data);
    const signature = signMessage(state.data.validator_privkey, reqstr);
    const gendata = new MsgNewChainGenesisData(subchaindata, chaindata.msg.validators, [signature])
    setSubChainData(gendata)

    // TODO event that this user should create genTx
    LoggerInfo("genesis data created", ["chain_id", chainId.full])
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

    const state = getChainSetupData()
    if (state == null) {
        revert(`setup state not stored`)
        return;
    }

    const oldData = getSubChainData()
    if (oldData != null) {
        // TODO check our signature is good if we received an updated version
        // check that genesis data is unchanged

        // return if old data
        if (oldData.signatures.length > data.signatures.length) return;
        if (oldData.data.genTxs.length > data.data.genTxs.length) return;
    } else {
        // we need to add our signature on the genesis data
        const datastr = JSON.stringify<InitSubChainDeterministicRequest>(data.data.data)
        const signature = signMessage(state.data.validator_privkey, datastr);

        let ourindex = 0;
        for (let i = 0; i < data.validators.length; i++) {
            if (data.validators[i].consensusPublicKey == state.data.validator_pubkey) {
                ourindex = i;
            }
        }
        data.signatures[ourindex] = signature;

        // TODO create genTx
        LoggerInfo("genesis data received", ["chain_id", data.data.data.init_chain_request.chain_id])

        // send the new message
        sendNewChainGenesisDataInternal(data, state)
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

    tnd2utils.initSubChain(
        chaindata.data,
        state.data.validator_pubkey,
        state.data.validator_address,
        state.data.validator_privkey,
    )

    // TODO send new chainid after init
    const chainIdFull = gendata.data.data.init_chain_request.chain_id
    const chainId = parseChainId(chainIdFull)
    setChainIdLast(chainId)
    sendLastChainIdInternal(state, chainId)
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
        }
    }
    // already added
    // gendata.signatures[i] = signature

    setSubChainData(gendata)
    sendNewChainGenesisDataInternal(gendata, state)
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
    const protocolId = getProtocolId(state.data.chain_id)
    const topic = getTopic(state.data.chain_id, cfg.ROOM_NEW_CHAIN)
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
    const protocolId = getProtocolId(state.data.chain_id)
    const topic = getTopic(state.data.chain_id, cfg.ROOM_LOBBY)
    p2pw.SendMessageToChatRoom(new p2ptypes.SendMessageToChatRoomRequest(contract, contract, signeddata, protocolId, topic))
}
