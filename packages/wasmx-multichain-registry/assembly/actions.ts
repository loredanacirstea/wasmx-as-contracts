import { JSON } from "json-as";
import * as base64 from "as-base64/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as cross from "wasmx-env/assembly/crosschain";
import * as roles from "wasmx-env/assembly/roles";
import * as modnames from "wasmx-env/assembly/modules";
import * as authzdefaults from "wasmx-env/assembly/defaults_authz";
// import * as capabilitydefaults from "wasmx-env/assembly/defaults_capability";
import * as circuitdefaults from "wasmx-env/assembly/defaults_circuit";
import * as crisisdefaults from "wasmx-env/assembly/defaults_crisis";
import * as evidencedefaults from "wasmx-env/assembly/defaults_evidence";
import * as groupdefaults from "wasmx-env/assembly/defaults_group";
import * as mintdefaults from "wasmx-env/assembly/defaults_mint";
import * as networkdefaults from "wasmx-env/assembly/defaults_network";
import * as upgradedefaults from "wasmx-env/assembly/defaults_upgrade";
import * as wasmxtypes from "wasmx-wasmx/assembly/types";
import * as wasmxdefaults from "wasmx-wasmx/assembly/defaults";
import * as websrvdefaults from "wasmx-env/assembly/defaults_websrv";
import * as utils from "wasmx-utils/assembly/utils";
import * as authtypes from "wasmx-auth/assembly/types";
import * as authdefaults from "wasmx-auth/assembly/defaults";
import * as banktypes from "wasmx-bank/assembly/types";
import * as bankdefaults from "wasmx-bank/assembly/defaults";
import * as stakingutils from "wasmx-stake/assembly/msg_utils";
import * as stakingdefaults from "wasmx-stake/assembly/defaults";
import * as distributiontypes from "wasmx-distribution/assembly/types";
import * as distributiondefaults from "wasmx-distribution/assembly/defaults";
import * as govtypes from "wasmx-gov/assembly/types";
import * as govdefaults from "wasmx-gov/assembly/defaults";
import * as slashingtypes from "wasmx-slashing/assembly/types";
import * as slashingdefaults from "wasmx-slashing/assembly/defaults";
import { AnyWrap } from "wasmx-env/assembly/wasmx_types";
import { ChainConfig, ChainId, GenesisState, GenutilGenesis, InitSubChainDeterministicRequest, NodePorts } from "wasmx-consensus/assembly/types_multichain";
import { buildChainConfig, getDefaultConsensusParams } from "wasmx-consensus/assembly/multichain_utils";
import * as wasmxt from "wasmx-env/assembly/types";
import { Base64String, Coin, SignedTransaction, Event, EventAttribute, PublicKey, Bech32String } from "wasmx-env/assembly/types";
import { AttributeKeyChainId, AttributeKeyRequest, AttributeKeyValidator, EventTypeInitSubChain, EventTypeRegisterSubChain, EventTypeRegisterSubChainValidator } from "./events";
import { addChainId, addChainValidator, addChainValidatorAddress, addLevelChainId, CURRENT_LEVEL, getChainData, getChainIdLast, getChainIds, getChainValidatorAddresses, getChainValidators, getCurrentLevel, getDataKey, getLevelChainIds, getLevelChainIdsKey, getLevelLast, getParams, getValidatorChains, INITIAL_LEVEL, setChainData, setChainIdLast } from "./storage";
import { CosmosmodGenesisState, CROSS_CHAIN_TIMEOUT_MS, InitSubChainRequest, MODULE_NAME, Params, QueryConvertAddressByChainIdRequest, QueryGetCurrentLevelRequest, QueryGetCurrentLevelResponse, QueryGetSubChainIdsByLevelRequest, QueryGetSubChainIdsByValidatorRequest, QueryGetSubChainIdsRequest, QueryGetSubChainRequest, QueryGetSubChainsByIdsRequest, QueryGetSubChainsRequest, QueryGetValidatorsByChainIdRequest, QuerySubChainConfigByIdsRequest, QueryValidatorAddressesByChainIdRequest, RegisterDefaultSubChainRequest, RegisterSubChainRequest, RegisterSubChainValidatorRequest, RemoveSubChainRequest, SubChainData, ValidatorInfo } from "./types";
import { LoggerDebug, LoggerInfo, revert } from "./utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { RequestInitChain } from "wasmx-consensus/assembly/types_tendermint";
import { BondedS, Delegation, MsgCreateValidator, Validator, getValidatorFromMsgCreate } from "wasmx-stake/assembly/types";

export function InitSubChain(req: InitSubChainRequest): ArrayBuffer {
    LoggerInfo("initializing subchain", ["subchain_id", req.chainId])
    const lastLevel = getLevelLast()
    const chaindata = getChainData(req.chainId)
    if (chaindata == null) {
        revert(`subchain not registered: ${req.chainId}`);
        return new ArrayBuffer(0);
    }
    const params = getParams()
    // how many upper levels can we initialize
    // this is mostly a limit for chains with 1 validator
    // to not infinitely create upper levels
    const maxNewUpperLevels = lastLevel + 1 - chaindata.level
    initSubChainInternalWithAuth(chaindata, params.min_validators_count, maxNewUpperLevels)
    LoggerInfo("initialized subchain", ["subchain_id", req.chainId])
    return new ArrayBuffer(0);
}

export function RegisterDefaultSubChain(req: RegisterDefaultSubChainRequest): ArrayBuffer {
    if (!passCheckEIDActive(wasmxw.getCaller())) {
        revert(`unauthorized: no eID active`);
    }
    LoggerInfo("start registering new default subchain", ["chain_base_name", req.chain_base_name])
    const chainId = registerDefaultChainId(req.chain_base_name, req.level_index)
    registerDefaultSubChainInternal(getParams(), chainId.full, req, INITIAL_LEVEL, new Map<Bech32String,wasmxt.ContractStorage[]>());
    LoggerInfo("registered new default subchain", ["chain_base_name", req.chain_base_name])
    return new ArrayBuffer(0);
}

export function RegisterSubChain(req: RegisterSubChainRequest): ArrayBuffer {
    if (!passCheckEIDActive(wasmxw.getCaller())) {
        revert(`unauthorized: no eID active`);
    }
    const initialLevel = 1;
    registerSubChainInternal(req.data, req.genTxs, req.initial_balance, initialLevel)
    return new ArrayBuffer(0);
}

export function RegisterSubChainValidator(req: RegisterSubChainValidatorRequest): ArrayBuffer {
    if (!passCheckEIDActive(wasmxw.getCaller())) {
        revert(`unauthorized: no eID active`);
    }
    LoggerInfo("start registering new subchain validator", ["subchain_id", req.chainId])
    registerSubChainValidatorInternal(req.chainId, req.genTx);
    return new ArrayBuffer(0);
}

export function RemoveSubChain(req: RemoveSubChainRequest): ArrayBuffer {
    removeSubChain(req.chainId)
    LoggerInfo("removed subchain temporary data", ["subchain_id", req.chainId])
    return new ArrayBuffer(0);
}

export function GetSubChains(req: QueryGetSubChainsRequest): ArrayBuffer {
    const ids = getChainIds();
    const data: InitSubChainDeterministicRequest[] = [];
    for (let i = 0; i < ids.length; i++) {
        const chain = getChainData(ids[i])
        if (chain != null && chain.initialized) {
            data.push(chain.data);
        }
    }
    const encoded = JSON.stringify<InitSubChainDeterministicRequest[]>(data)
    return String.UTF8.encode(encoded)
}

export function GetSubChainsByIds(req: QueryGetSubChainsByIdsRequest): ArrayBuffer {
    const data: InitSubChainDeterministicRequest[] = [];
    for (let i = 0; i < req.ids.length; i++) {
        const chain = getChainData(req.ids[i])
        if (chain != null && chain.initialized) {
            data.push(chain.data);
        }
    }
    const encoded = JSON.stringify<InitSubChainDeterministicRequest[]>(data)
    return String.UTF8.encode(encoded)
}

export function GetSubChainIds(req: QueryGetSubChainIdsRequest): ArrayBuffer {
    const ids = getChainIds();
    return String.UTF8.encode(JSON.stringify<string[]>(ids))
}

export function GetSubChainById(req: QueryGetSubChainRequest): ArrayBuffer {
    const chaindata = getChainData(req.chainId)
    if (chaindata == null) {
        return new ArrayBuffer(0)
    }
    const encoded = JSON.stringify<InitSubChainDeterministicRequest>(chaindata.data)
    return String.UTF8.encode(encoded)
}

export function GetSubChainConfigById(req: QueryGetSubChainRequest): ArrayBuffer {
    const config = subChainConfigById(req.chainId)
    if (config == null) {
        return new ArrayBuffer(0)
    }
    const encoded = JSON.stringify<ChainConfig>(config)
    return String.UTF8.encode(encoded)
}

export function GetSubChainConfigByIds(req: QuerySubChainConfigByIdsRequest): ArrayBuffer {
    const data: ChainConfig[] = [];
    for (let i = 0; i < req.ids.length; i++) {
        const chain = subChainConfigById(req.ids[i])
        if (chain != null) {
            data.push(chain);
        }
    }
    const encoded = JSON.stringify<ChainConfig[]>(data)
    return String.UTF8.encode(encoded)
}

export function GetSubChainIdsByLevel(req: QueryGetSubChainIdsByLevelRequest): ArrayBuffer {
    const ids = getLevelChainIds(req.level);
    return String.UTF8.encode(JSON.stringify<string[]>(ids))
}

export function GetCurrentLevel(req: QueryGetCurrentLevelRequest): ArrayBuffer {
    const level = getCurrentLevel()
    return String.UTF8.encode(JSON.stringify<QueryGetCurrentLevelResponse>(new QueryGetCurrentLevelResponse(level)))
}

export function GetSubChainIdsByValidator(req: QueryGetSubChainIdsByValidatorRequest): ArrayBuffer {
    const ids = getValidatorChains(req.validator_address);
    return String.UTF8.encode(JSON.stringify<string[]>(ids))
}

export function GetValidatorsByChainId(req: QueryGetValidatorsByChainIdRequest): ArrayBuffer {
    const gentxs = getChainValidators(req.chainId);
    return String.UTF8.encode(JSON.stringify<string[]>(gentxs))
}

export function GetValidatorAddressesByChainId(req: QueryValidatorAddressesByChainIdRequest): ArrayBuffer {
    const addrs = getChainValidatorAddresses(req.chainId);
    return String.UTF8.encode(JSON.stringify<string[]>(addrs))
}

export function ConvertAddressByChainId(req: QueryConvertAddressByChainIdRequest): ArrayBuffer {
    let prefix = req.prefix;
    if (req.chainId != "") {
        let config: ChainConfig;
        const chaindata = getChainData(req.chainId)
        if (chaindata == null) {
            return new ArrayBuffer(0)
        }
        config = chaindata.data.chain_config;
        if (req.type == "acc") {
            prefix = config.Bech32PrefixAccAddr
        } else if (req.type == "cons") {
            prefix = config.Bech32PrefixConsAddr
        } else if (req.type == "val") {
            prefix = config.Bech32PrefixValAddr
        }
    }
    const newaddr = convertAddress(req.address, prefix)
    return String.UTF8.encode(newaddr)
}

export function CrossChainTx(req: wasmxt.MsgCrossChainCallRequest): ArrayBuffer {
    const newreq = prepareCrossChainCallRequest(req)
    if (newreq == null) {
        // we do not allow calls to chains that we do not have in the registry
        const resp = new wasmxt.MsgCrossChainCallResponse(`target chain configuration not found: ${req.to_chain_id}`, "");
        return String.UTF8.encode(JSON.stringify<wasmxt.MsgCrossChainCallResponse>(resp))
    }
    const reqdata = JSON.stringify<wasmxt.MsgCrossChainCallRequest>(newreq)
    return cross.executeCrossChainTx(String.UTF8.encode(reqdata));
}

export function CrossChainQuery(req: wasmxt.MsgCrossChainCallRequest): ArrayBuffer {
    const newreq = prepareCrossChainCallRequest(req)
    if (newreq == null) {
        // we do not allow calls to chains that we do not have in the registry
        const resp = new wasmxt.MsgCrossChainCallResponse("target chain configuration not found", "");
        return String.UTF8.encode(JSON.stringify<wasmxt.MsgCrossChainCallResponse>(resp))
    }
    const reqdata = JSON.stringify<wasmxt.MsgCrossChainCallRequest>(newreq)
    return cross.executeCrossChainQuery(String.UTF8.encode(reqdata));
}

export function CrossChainQueryNonDeterministic(req: wasmxt.MsgCrossChainCallRequest): ArrayBuffer {
    const newreq = prepareCrossChainCallRequest(req)
    if (newreq == null) {
        // we do not allow calls to chains that we do not have in the registry
        const resp = new wasmxt.MsgCrossChainCallResponse("target chain configuration not found", "");
        return String.UTF8.encode(JSON.stringify<wasmxt.MsgCrossChainCallResponse>(resp))
    }
    const reqdata = JSON.stringify<wasmxt.MsgCrossChainCallRequest>(newreq)
    return cross.executeCrossChainQueryNonDeterministic(String.UTF8.encode(reqdata));
}

export function prepareCrossChainCallRequest(req: wasmxt.MsgCrossChainCallRequest): wasmxt.MsgCrossChainCallRequest | null {
    const caller = wasmx.getCaller()
    const callerBech32 = wasmxw.addr_humanize(caller)
    const toChainConfig = subChainConfigById(req.to_chain_id)
    if (toChainConfig == null) {
        return null;
    }
    req.from_chain_id = wasmxw.getChainId()
    // we give the bech32 address as bytes
    req.from = wasmxw.addr_humanize_mc(String.UTF8.encode(callerBech32), toChainConfig.Bech32PrefixAccAddr)

    // if address does not have the correct prefix, we convert it
    const toAddr = wasmxw.addr_canonicalize_mc(req.to)
    if (toAddr.prefix != toChainConfig.Bech32PrefixAccAddr) {
        req.to = wasmxw.addr_humanize_mc(base64.decode(toAddr.bz).buffer, toChainConfig.Bech32PrefixAccAddr);
    }
    req.timeout_ms = CROSS_CHAIN_TIMEOUT_MS
    return req
}

export function convertAddress(sourceAddr: Bech32String, prefix: string): string {
    const addr = wasmxw.addr_canonicalize_mc(sourceAddr)
    return wasmxw.addr_humanize_mc(base64.decode(addr.bz).buffer, prefix);
}

export function subChainConfigById(chainId: string): ChainConfig | null {
    const chaindata = getChainData(chainId)
    if (chaindata == null) {
        return null
    }
    return chaindata.data.chain_config
}

export function tryRegisterUpperLevel(lastRegisteredLevel: i32, lastRegisteredChainId: string, trynextlevel: i32): void {
    const params = getParams()
    const levelchains = getLevelChainIds(lastRegisteredLevel)
    const count = levelchains.length;
    if (count % params.min_validators_count > 0) return;

    const nextLevel = lastRegisteredLevel + 1

    const upperlevels = getLevelChainIds(nextLevel);
    const expectedLevels = i32(count / params.min_validators_count);
    if (upperlevels.length >= expectedLevels) return;

    LoggerInfo("registering subchain", ["subchain_level", nextLevel.toString()])

    // subchains that will provide a validator each
    const subchainIds = levelchains.slice(count - params.min_validators_count)

    // genesis state for registry contract

    // registry contract storage key-pairs
    const wasmxContractState = new Map<Bech32String,wasmxt.ContractStorage[]>()
    // key: HexString, value: Base64String
    const registryContractState = new Array<wasmxt.ContractStorage>(2+subchainIds.length)
    // store current level
    registryContractState[0] = new wasmxt.ContractStorage(
        utils.uint8ArrayToHex(Uint8Array.wrap(String.UTF8.encode(CURRENT_LEVEL))),
        utils.stringToBase64(nextLevel.toString()),
    )
    // store child contract chain ids
    // on the last registered level, we only have our own kids
    registryContractState[1] = new wasmxt.ContractStorage(
        utils.uint8ArrayToHex(Uint8Array.wrap(String.UTF8.encode(getLevelChainIdsKey(lastRegisteredLevel)))),
        utils.stringToBase64(JSON.stringify<string[]>(subchainIds)),
    )
    // store child chain configurations
    for (let i = 0; i < subchainIds.length; i++) {
        const subchainId = subchainIds[i]
        registryContractState[2+i] = new wasmxt.ContractStorage(
            utils.uint8ArrayToHex(Uint8Array.wrap(String.UTF8.encode(getDataKey(subchainId)))),
            utils.stringToBase64(wasmxw.sload(getDataKey(subchainId))),
        )
    }
    // TODO store other stuff too

    wasmxContractState.set(wasmxdefaults.ADDR_MULTICHAIN_REGISTRY, registryContractState)

    const newChainId = registerDefaultChainIdSubChainLevel(nextLevel)

    // we need to create another level
    let subchaindata = registerDefaultSubChainLevel(params, newChainId, nextLevel, wasmxContractState, params.level_initial_balance);
    LoggerInfo("registered subchain", ["subchain_level", nextLevel.toString(), "subchain_id", newChainId.full, "composing_subchains", subchainIds.join(",")])


    const valInfos: ValidatorInfo[] = []
    for (let i = 0; i < subchainIds.length; i++) {
        const valIndex = 0; // we take the first validator of each chain
        // TODO the algorithm whould rotate validators
        let valInfo = getChainValidatorInfoFromSubChain(subchainIds[i], valIndex)
        if (valInfo == null) continue;
        const val = valInfo.validator;
        const valAddr = wasmxw.addr_canonicalize_mc(val.operator_address)
        const newValidatorAddress = wasmxw.addr_humanize_mc(
            base64.decode(valAddr.bz).buffer,
            subchaindata.data.chain_config.Bech32PrefixAccAddr,
        )
        const newval = new Validator(
            newValidatorAddress,
            val.consensus_pubkey,
            false,
            BondedS,
            // must be smaller than overall balance
            params.level_initial_balance.div(BigInt.fromU64(u64(100))),
            val.delegator_shares,
            val.description,
            val.unbonding_height,
            val.unbonding_time,
            val.commission,
            val.min_self_delegation,
            0,
            [],
        )
        // TODO fix memo - replace address
        valInfo.p2p_address = replacePeerOperatorAddress(valInfo.p2p_address, newValidatorAddress)
        const newValInfo = new ValidatorInfo(newval, valInfo.operator_pubkey, valInfo.p2p_address)
        valInfos.push(newValInfo);
    }
    LoggerInfo("registering subchain with validators", ["subchain_level", nextLevel.toString(), "subchain_id", newChainId.full, "validator_count", valInfos.length.toString()])
    subchaindata = includeValidatorInfos(subchaindata, valInfos)
    setChainData(subchaindata)

    LoggerInfo("initializing subchain", ["subchain_level", nextLevel.toString(), "subchain_id", newChainId.full])

    initSubChainInternalWithAuth(subchaindata, params.min_validators_count, trynextlevel)
    LoggerInfo("initialized subchain", ["subchain_level", nextLevel.toString(), "subchain_id", newChainId.full])
}

export function registerDefaultSubChainLevel(params: Params, chainId: ChainId, levelIndex: i32, wasmxContractState: Map<Bech32String,wasmxt.ContractStorage[]>, initialBalance: BigInt): SubChainData {
    const denomUnit = `lvl${levelIndex}`
    const req = new RegisterDefaultSubChainRequest(denomUnit, 18, chainId.base_name, levelIndex, initialBalance, [])
    return registerDefaultSubChainInternal(params, chainId.full, req, levelIndex, wasmxContractState)
}

export function getChainBaseNameSubChainLevel(levelIndex: i32): string {
    return `level${levelIndex}`
}

export function registerDefaultChainIdSubChainLevel(levelIndex: i32): ChainId {
    const chainBaseName = getChainBaseNameSubChainLevel(levelIndex)
    return registerDefaultChainId(chainBaseName, levelIndex);
}

export function registerDefaultChainId(chainBaseName: string, levelIndex: i32): ChainId {
    // we start at 1, not 0, to leave space for level0 ids
    const chainIndex = getChainIdLast() + 1
    setChainIdLast(chainIndex)
    return new ChainId("", chainBaseName, levelIndex, chainIndex, 1)
}

// TODO each level can create a chain for the next level only?
// so add the level number in genesis
export function buildDefaultSubChainGenesisInternal(params: Params, chainId: string, currentLevel: i32, chainConfig: ChainConfig, req: RegisterDefaultSubChainRequest, wasmxContractState: Map<Bech32String,wasmxt.ContractStorage[]>, initialPorts: NodePorts): InitSubChainDeterministicRequest {
    const peers: string[] = [];
    const defaultInitialHeight: i64 = 1;
    const consensusParams = getDefaultConsensusParams()

    const bootstrapAccountBech32 = wasmxw.addr_humanize_mc(utils.hexToUint8Array(modnames.ADDR_BOOTSTRAP_ACCOUNT).buffer, chainConfig.Bech32PrefixAccAddr)
    const feeCollectorBech32 =  wasmxw.addr_humanize_mc(utils.hexToUint8Array(modnames.ADDR_FEE_COLLECTOR).buffer, chainConfig.Bech32PrefixAccAddr)
    const mintBech32 =  wasmxw.addr_humanize_mc(utils.hexToUint8Array(modnames.ADDR_MINT).buffer, chainConfig.Bech32PrefixAccAddr)

    const genesisState = buildGenesisData(params, req.denom_unit, req.base_denom_unit, bootstrapAccountBech32, feeCollectorBech32, mintBech32, currentLevel, wasmxContractState, initialPorts, chainConfig.Bech32PrefixAccAddr)

    const appStateBz = utils.stringToBase64(JSON.stringify<GenesisState>(genesisState))

    const initChainReq = new RequestInitChain(
        new Date(Date.now()).toISOString(),
        chainId,
        consensusParams,
        [],
        appStateBz,
        defaultInitialHeight,
    )
    return new InitSubChainDeterministicRequest(initChainReq, chainConfig, peers);
}

// TODO each level can create a chain for the next level only?
// so add the level number in genesis
export function registerDefaultSubChainInternal(params: Params, chainId: string, req: RegisterDefaultSubChainRequest, levelIndex: i32, wasmxContractState: Map<Bech32String,wasmxt.ContractStorage[]>): SubChainData {
    const chainConfig = buildChainConfig(req.denom_unit, req.base_denom_unit, req.chain_base_name)
    const initialPorts = new NodePorts()
    const data = buildDefaultSubChainGenesisInternal(params, chainId, levelIndex, chainConfig, req, wasmxContractState, initialPorts)
    return registerSubChainInternal(data, req.gen_txs, req.initial_balance, levelIndex);
}

export function registerSubChainInternal(data: InitSubChainDeterministicRequest, genTxs: Base64String[], initialBalance: BigInt, levelIndex: i32): SubChainData {
    const chainId = data.init_chain_request.chain_id
    addChainId(chainId);
    const chaindata = new SubChainData(data, genTxs, initialBalance, levelIndex);
    setChainData(chaindata);
    for (let i = 0; i < genTxs.length; i++) {
        registerSubChainValidatorInternal(chainId, genTxs[i]);
    }

    // emit registration event with chainId
    const ev = new Event(
        EventTypeRegisterSubChain,
        [
            new EventAttribute(AttributeKeyChainId, chainId, true),
        ],
    )
    wasmxw.emitCosmosEvents([ev]);
    return chaindata;
}

export function registerSubChainValidatorInternal(chainId: string, genTx: Base64String): void {
    // we verify the transaction when the subchain is started
    // TODO we should verify now too
    let genTxStr = String.UTF8.decode(base64.decode(genTx).buffer)
    const tx = JSON.parse<SignedTransaction>(genTxStr)
    const msg = stakingutils.extractCreateValidatorMsg(tx)
    if (msg == null) {
        revert(`invalid gentx: does not contain MsgCreateValidator`);
        return;
    }
    const caller = wasmxw.getCaller();
    if (!wasmxw.addr_equivalent(caller, msg.validator_address)) {
        revert(`unauthorized: caller ${caller}, validator ${msg.validator_address}`)
    }
    addChainValidator(chainId, msg.validator_address, genTx)

    // we add the peer from the tx memo
    const chaindata = getChainData(chainId)
    if (chaindata == null) {
        revert(`no subchain found: ${chainId}`)
        return
    }
    chaindata.data.peers.push(tx.body.memo)
    chaindata.genTxs.push(genTx)
    setChainData(chaindata);
    LoggerInfo("registered new subchain validator", ["subchain_id", chainId, "address", msg.validator_address])
    // emit registration event with chainId
    const ev = new Event(
        EventTypeRegisterSubChainValidator,
        [
            new EventAttribute(AttributeKeyChainId, chainId, true),
            new EventAttribute(AttributeKeyValidator, msg.validator_address, true),
        ],
    )
    wasmxw.emitCosmosEvents([ev]);
}

export function removeSubChain(chainId: string): void {
    // TODO only first validator can remove this
    // only if not initialized
}

export function initSubChainInternalWithAuth(chaindata: SubChainData, minValidatorCount: i32, trynextlevel: i32): void {
    const chainId = chaindata.data.init_chain_request.chain_id
    // only the first validator can execute this
    const addr = getChainValidatorAddresses(chainId)
    if (addr.length < minValidatorCount) {
        revert(`subchain needs at least ${minValidatorCount} validators; has ${addr.length} addresses registered`)
    }
    const caller = wasmxw.getCaller()
    if (!wasmxw.addr_equivalent(caller, addr[0])) {
        revert(`unauthorized: caller ${caller}, validator ${addr[0]}`)
    }

    const genTxs = getChainValidators(chainId)
    return initSubChainInternal(chaindata, genTxs, minValidatorCount, trynextlevel)
}

export function initSubChainInternal(chaindata: SubChainData, genTxs: Base64String[], minValidatorCount: i32, trynextlevel: i32): void {
    const chainId = chaindata.data.init_chain_request.chain_id
    chaindata = initSubChainPrepareData(chaindata, genTxs, minValidatorCount)

    setChainData(chaindata);
    const data = JSON.stringify<InitSubChainDeterministicRequest>(chaindata.data);
    const data64 = base64.encode(Uint8Array.wrap(String.UTF8.encode(data)))
    const ev = new Event(
        EventTypeInitSubChain,
        [
            new EventAttribute(AttributeKeyChainId, chaindata.data.init_chain_request.chain_id, true),
            new EventAttribute(AttributeKeyRequest, data64, false),
        ],
    )
    wasmxw.emitCosmosEvents([ev]);

    // check if we need to trigger the registration of any upper level
    addLevelChainId(chaindata.level, chainId)
    if (trynextlevel > 0) {
        tryRegisterUpperLevel(chaindata.level, chainId, trynextlevel - 1)
    }
}

export function initSubChainPrepareData(chaindata: SubChainData, genTxs: Base64String[], minValidatorCount: i32): SubChainData {
    // we emit a subchain event
    chaindata.data.init_chain_request.time = new Date(Date.now()).toISOString()

    const appstate = utils.base64ToString(chaindata.data.init_chain_request.app_state_bytes)
    let genesisState: GenesisState = JSON.parse<GenesisState>(appstate)
    genesisState = includeGenTxs(genesisState, genTxs, chaindata.initial_balance)
    genesisState = includeWasmxState(genesisState, chaindata.wasmxContractState)

    const validatorCount = getValidatorCountFromGenesis(genesisState)
    if (validatorCount < minValidatorCount) {
        revert(`subchain needs at least ${minValidatorCount} validators; has ${validatorCount} registered in genesis`)
    }
    const newGenesisState = JSON.stringify<GenesisState>(genesisState)
    chaindata.data.init_chain_request.app_state_bytes = utils.stringToBase64(newGenesisState);
    chaindata.initialized = true;
    return chaindata;
}

export function includeWasmxState(genesisState: GenesisState, wasmxContractState: Map<string, wasmxt.ContractStorage[]>): GenesisState {
    // update wasmx state
    if (!genesisState.has(modnames.MODULE_WASMX)) {
        revert(`genesis state missing field: ${modnames.MODULE_WASMX}`)
    }
    const wasmxGenesisStr = utils.base64ToString(genesisState.get(modnames.MODULE_WASMX))
    let wasmxGenesis = JSON.parse<wasmxtypes.GenesisState>(wasmxGenesisStr)

    // set any contract storage key-value pairs
    for (let i = 0; i < wasmxGenesis.system_contracts.length; i++) {
        const c = wasmxGenesis.system_contracts[i]
        if (wasmxContractState.has(c.address)) {
            // merge state - if we have contradicting states, we revert
            const mergedState = mergeWasmxState(wasmxGenesis.system_contracts[i].contract_state, wasmxContractState.get(c.address))
            wasmxGenesis.system_contracts[i].contract_state = mergedState;
        }
    }

    const newwasmxGenesisStr = utils.stringToBase64(JSON.stringify<wasmxtypes.GenesisState>(wasmxGenesis))
    genesisState.set(modnames.MODULE_WASMX, newwasmxGenesisStr)
    return genesisState;
}

export function mergeWasmxState(oldstate: wasmxt.ContractStorage[], newstate: wasmxt.ContractStorage[]): wasmxt.ContractStorage[] {
    // merge state - if we have contradicting states, we revert
    const extantKeys = new Map<string,string>()
    for (let j = 0; j < oldstate.length; j++) {
        extantKeys.set(oldstate[j].key, oldstate[j].value)
    }
    for (let j = 0; j < newstate.length; j++) {
        if (extantKeys.has(newstate[j].key)) {
            if (extantKeys.get(newstate[j].key) != newstate[j].value) {
                revert(`genesis wasmx contract storage value mismatch: key ${newstate[j].key}, value ${newstate[j].value}`)
            }
        } else {
            oldstate.push(newstate[j])
        }
    }
    return oldstate;
}

export function includeGenTxs(genesisState: GenesisState, genTxs: Base64String[], initial_balance: BigInt): GenesisState {
    if (genTxs.length == 0) return genesisState;

    // update genutil
    const genutil = new GenutilGenesis(genTxs)
    const genutilData = utils.stringToBase64(JSON.stringify<GenutilGenesis>(genutil))
    genesisState.set(modnames.MODULE_GENUTIL, genutilData)

    // update bank balances & create auth accounts
    if (!genesisState.has(modnames.MODULE_COSMOSMOD)) {
        revert(`genesis state missing field: ${modnames.MODULE_COSMOSMOD}`)
    }
    const cosmosmodGenesisStr = utils.base64ToString(genesisState.get(modnames.MODULE_COSMOSMOD))
    let cosmosmodGenesis = JSON.parse<CosmosmodGenesisState>(cosmosmodGenesisStr)

    // bankGenesis.balances
    for (let i = 0; i < genTxs.length; i++) {
        const genTx = genTxs[i]
        let genTxStr = utils.base64ToString(genTx)
        const tx = JSON.parse<SignedTransaction>(genTxStr)
        const msg = stakingutils.extractCreateValidatorMsg(tx)
        if (msg == null) {
            continue;
        }

        if (tx.auth_info.signer_infos.length == 0) {
            revert(`genTx transaction has empty signer_infos`)
        }
        const signer = tx.auth_info.signer_infos[0]

        cosmosmodGenesis = includeValidatorAccountInfo(cosmosmodGenesis, msg.validator_address,  signer.public_key, initial_balance)
    }

    const newcosmosmodGenesisStr = utils.stringToBase64(JSON.stringify<CosmosmodGenesisState>(cosmosmodGenesis))

    genesisState.set(modnames.MODULE_COSMOSMOD, newcosmosmodGenesisStr)
    return genesisState;
}

export function passCheckEIDActive(addr: Bech32String): boolean {
    const params = getParams()
    if (params.enable_eid_check) {
        return isEIDActive(addr)
    }
    return true;
}

export function isEIDActive(addr: Bech32String): boolean {
    // isActive(address walletOwner)
    const signature = "9f8a13d7"
    const addrbz = Uint8Array.wrap(wasmxw.addr_canonicalize(addr))
    const padded = new Uint8Array(32);
    padded.set(addrbz, 32 - addrbz.length);
    const calldatastr = "0x" + signature + utils.uint8ArrayToHex(padded)
    const resp = callEvmContract(roles.ROLE_EID_REGISTRY, calldatastr, false)
    if (resp.success > 0) {
        return false;
    }
    const active = BigInt.fromUint8Array(base64.decode(resp.data))
    return !active.isZero()
}

export function callEvmContract(addr: Bech32String, calldata: string, isQuery: boolean): wasmxt.CallResponse {
    const req = new wasmxt.CallRequest(addr, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.callEvm(req, MODULE_NAME);
    return resp;
}

export function buildGenesisData(params: Params, denomUnit: string, baseDenomUnit: u32, bootstrapAccountBech32: string, feeCollectorBech32: string, mintBech32: string, currentLevel: i32, wasmxContractState: Map<Bech32String,wasmxt.ContractStorage[]>, initialPorts: NodePorts, bech32PrefixAccAddr: string): GenesisState {
    // validators are only added through genTxs
    const bankGenesis = bankdefaults.getDefaultGenesis(denomUnit, baseDenomUnit, params.erc20CodeId, params.derc20CodeId)

    const gasBaseDenom = bankGenesis.denom_info[0].metadata.base
    const stakingBaseDenom = bankGenesis.denom_info[1].metadata.base
    const rewardsBaseDenom = bankGenesis.denom_info[2].metadata.base

    const stakingGenesis = stakingdefaults.getDefaultGenesis(gasBaseDenom, stakingBaseDenom)
    const govGenesis = govdefaults.getDefaultGenesis(gasBaseDenom, stakingBaseDenom, rewardsBaseDenom)
    const slashingGenesis = slashingdefaults.getDefaultGenesis()
    const distributionGenesis = distributiondefaults.getDefaultGenesis(gasBaseDenom, rewardsBaseDenom)
    const authGenesis = authdefaults.getDefaultGenesis()

    const cosmosmodGenesis = new CosmosmodGenesisState(
        stakingGenesis,
        bankGenesis,
        govGenesis,
        authGenesis,
        slashingGenesis,
        distributionGenesis,
    )
    const cosmosmodGenesisBz = utils.stringToBase64(JSON.stringify<CosmosmodGenesisState>(cosmosmodGenesis))

    const authzGenesis = authzdefaults.getDefaultGenesis()
    const authzGenesisBz = utils.stringToBase64(JSON.stringify<authzdefaults.GenesisState>(authzGenesis))

    // const capabilityGenesis = capabilitydefaults.getDefaultGenesis()
    const circuitGenesis = circuitdefaults.getDefaultGenesis()
    const circuitGenesisBz = utils.stringToBase64(JSON.stringify<circuitdefaults.GenesisState>(circuitGenesis))

    const crisisGenesis = crisisdefaults.getDefaultGenesis(stakingBaseDenom)
    const crisisGenesisBz = utils.stringToBase64(JSON.stringify<crisisdefaults.GenesisState>(crisisGenesis))

    const evidenceGenesis = evidencedefaults.getDefaultGenesis()
    const evidenceGenesisBz = utils.stringToBase64(JSON.stringify<evidencedefaults.GenesisState>(evidenceGenesis))

    const genutilGenesis = new GenutilGenesis([])
    const genutilGenesisBz = utils.stringToBase64(JSON.stringify<GenutilGenesis>(genutilGenesis))

    const groupGenesis = groupdefaults.getDefaultGenesis()
    const groupGenesisBz = utils.stringToBase64(JSON.stringify<groupdefaults.GenesisState>(groupGenesis))

    const mintGenesis = mintdefaults.getDefaultGenesis(gasBaseDenom)
    const mintGenesisBz = utils.stringToBase64(JSON.stringify<mintdefaults.GenesisState>(mintGenesis))

    const networkGenesis = networkdefaults.getDefaultGenesis()
    const networkGenesisBz = utils.stringToBase64(JSON.stringify<networkdefaults.GenesisState>(networkGenesis))

    // const transferGenesis = transferdefaults.getDefaultGenesis()

    const upgradeGenesis = upgradedefaults.getDefaultGenesis()
    const upgradeGenesisBz = utils.stringToBase64(JSON.stringify<upgradedefaults.GenesisState>(upgradeGenesis))

    const wasmxGenesis = wasmxdefaults.getDefaultGenesis(bootstrapAccountBech32, feeCollectorBech32, mintBech32, params.min_validators_count, params.enable_eid_check, currentLevel, JSON.stringify<NodePorts>(initialPorts), bech32PrefixAccAddr)

    // set any contract storage key-value pairs
    for (let i = 0; i < wasmxGenesis.system_contracts.length; i++) {
        const c = wasmxGenesis.system_contracts[i]
        if (wasmxContractState.has(c.address)) {
            wasmxGenesis.system_contracts[i].contract_state = wasmxContractState.get(c.address)
        }
    }

    const wasmxGenesisBz = utils.stringToBase64(JSON.stringify<wasmxtypes.GenesisState>(wasmxGenesis))

    const websrvGenesis = websrvdefaults.getDefaultGenesis()
    const websrvGenesisBz = utils.stringToBase64(JSON.stringify<websrvdefaults.GenesisState>(websrvGenesis))

    const genesisState: GenesisState = new Map<string,Base64String>()
    genesisState.set(modnames.MODULE_COSMOSMOD,  cosmosmodGenesisBz)
    genesisState.set(modnames.MODULE_AUTHZ,  authzGenesisBz)
    genesisState.set(modnames.MODULE_CIRCUIT,  circuitGenesisBz)
    genesisState.set(modnames.MODULE_CRISIS,  crisisGenesisBz)
    genesisState.set(modnames.MODULE_EVIDENCE,  evidenceGenesisBz)
    genesisState.set(modnames.MODULE_GENUTIL,  genutilGenesisBz)
    genesisState.set(modnames.MODULE_GROUP,  groupGenesisBz)
    genesisState.set(modnames.MODULE_MINT,  mintGenesisBz)
    genesisState.set(modnames.MODULE_NETWORK,  networkGenesisBz)
    genesisState.set(modnames.MODULE_UPGRADE,  upgradeGenesisBz)
    genesisState.set(modnames.MODULE_WASMX,  wasmxGenesisBz)
    genesisState.set(modnames.MODULE_WEBSRV,  websrvGenesisBz)

    return genesisState;
}

export function getChainValidatorInfoFromSubChain(chainId: string, index: i32): (ValidatorInfo | null) {
    let valInfo = getChainValidatorInfoFromGenTx(chainId, index)
    if (valInfo == null) {
        valInfo = getChainValidatorInfoFromGenesis(chainId, index)
    }
    return valInfo;
}

export function getChainValidatorInfoFromGenTx(chainId: string, index: i32): (ValidatorInfo | null) {
    const genTxs = getChainValidators(chainId)
    if (genTxs.length <= index) {
        return null;
    }
    const genTx = genTxs[index]
    let genTxStr = String.UTF8.decode(base64.decode(genTx).buffer)
    const tx = JSON.parse<SignedTransaction>(genTxStr)
    const msg = stakingutils.extractCreateValidatorMsg(tx)
    if (msg == null) {
        revert(`invalid gentx: does not contain MsgCreateValidator`);
        return null;
    }

    // get operator public key
    if (tx.auth_info.signer_infos.length == 0) {
        revert(`genTx transaction has empty signer_infos`)
    }
    const signer = tx.auth_info.signer_infos[0]
    return new ValidatorInfo(getValidatorFromMsgCreate(msg), signer.public_key, tx.body.memo)
}

export function getChainValidatorInfoFromGenesis(chainId: string, index: i32): (ValidatorInfo | null) {
    const chaindata = getChainData(chainId)
    if (chaindata == null) {
        return null;
    }
    const appstate = utils.base64ToString(chaindata.data.init_chain_request.app_state_bytes)
    let genesisState: GenesisState = JSON.parse<GenesisState>(appstate)
    if (!genesisState.has(modnames.MODULE_COSMOSMOD)) {
        return null;
    }
    const datastr = utils.base64ToString(genesisState.get(modnames.MODULE_COSMOSMOD))
    const data = JSON.parse<CosmosmodGenesisState>(datastr)

    if (data.staking.validators.length <= index) {
        LoggerDebug(`index out of bounds: ${index}, genesis validator count ${data.staking.validators.length}`, ["chain_id", chainId])
        return null;
    }
    if (chaindata.data.peers.length <= index) {
        LoggerDebug(`index out of bounds: ${index}, peers count ${chaindata.data.peers.length}`, ["chain_id", chainId])
        return null;
    }
    if (data.auth.accounts.length <= index) {
        LoggerDebug(`index out of bounds: ${index}, accounts count ${data.auth.accounts.length}`, ["chain_id", chainId])
        return null;
    }

    const valid = data.staking.validators[index]
    const peer = chaindata.data.peers[index]
    const auth = JSON.parse<authtypes.BaseAccount>(data.auth.accounts[index].value)
    return new ValidatorInfo(valid, auth.pub_key, peer)
}

export function includeValidatorAccountInfo(cosmosmodGenesis: CosmosmodGenesisState, operatorAddress: Bech32String, operatorPubKey: PublicKey | null, initial_balance: BigInt): CosmosmodGenesisState {
    const baseDenom = cosmosmodGenesis.bank.denom_info[0].metadata.base

    // new balance
    const balance = new banktypes.Balance(operatorAddress, [new Coin(baseDenom, initial_balance)])
    cosmosmodGenesis.bank.balances.push(balance);

    // new account
    let accPubKey: PublicKey | null = null;
    if (operatorPubKey != null) {
        accPubKey = new PublicKey(operatorPubKey.type_url, operatorPubKey.value);
    }
    // we set account number 0, because it is updated when wasmx-auth initGenesis is ran
    const account = new authtypes.BaseAccount(operatorAddress, accPubKey, 0, 0)
    let encoded = JSON.stringify<authtypes.BaseAccount>(account)
    const accountAny = AnyWrap.New(authtypes.TypeUrl_BaseAccount, encoded)
    cosmosmodGenesis.auth.accounts.push(accountAny);
    return cosmosmodGenesis;
}

export function includeValidatorInfos(data: SubChainData, validators: ValidatorInfo[]): SubChainData {
    if (validators.length == 0) return data;
    const appstate = utils.base64ToString(data.data.init_chain_request.app_state_bytes)
    const genesisState: GenesisState = JSON.parse<GenesisState>(appstate)

    // update bank balances & create auth accounts
    if (!genesisState.has(modnames.MODULE_COSMOSMOD)) {
        revert(`genesis state missing field: ${modnames.MODULE_COSMOSMOD}`)
    }
    const cosmosmodGenesisStr = utils.base64ToString(genesisState.get(modnames.MODULE_COSMOSMOD))
    let cosmosmodGenesis = JSON.parse<CosmosmodGenesisState>(cosmosmodGenesisStr)

    const chainId = data.data.init_chain_request.chain_id
    const peers: string[] = [];
    for (let i = 0; i < validators.length; i++) {
        const vinfo = validators[i]
        const val = vinfo.validator
        addChainValidatorAddress(chainId, val.operator_address);
        cosmosmodGenesis = includeValidatorAccountInfo(cosmosmodGenesis, val.operator_address, vinfo.operator_pubkey, data.initial_balance);

        // now also include staking validator info
        cosmosmodGenesis.staking.validators.push(val)
        cosmosmodGenesis.staking.delegations.push(new Delegation(
            vinfo.validator.operator_address,
            vinfo.validator.operator_address,
            vinfo.validator.tokens,
        ))
        peers.push(vinfo.p2p_address);
    }
    const newcosmosmodGenesisStr = utils.stringToBase64(JSON.stringify<CosmosmodGenesisState>(cosmosmodGenesis))

    genesisState.set(modnames.MODULE_COSMOSMOD, newcosmosmodGenesisStr)
    const newGenesisState = JSON.stringify<GenesisState>(genesisState)
    data.data.init_chain_request.app_state_bytes = utils.stringToBase64(newGenesisState);
    data.data.peers = peers;
    return data;
}

export function getValidatorCountFromGenesis(genesisState: GenesisState): i32 {
    let count = 0;
    if (genesisState.has(modnames.MODULE_GENUTIL)) {
        const datastr = utils.base64ToString(genesisState.get(modnames.MODULE_GENUTIL))
        const data = JSON.parse<GenutilGenesis>(datastr)
        count += data.gen_txs.length
    }
    if (genesisState.has(modnames.MODULE_COSMOSMOD)) {
        const datastr = utils.base64ToString(genesisState.get(modnames.MODULE_COSMOSMOD))
        const data = JSON.parse<CosmosmodGenesisState>(datastr)
        count += data.staking.validators.length
    }
    return count;
}

// mythos1ys790lnfkz7sn747wluvez00hap2h2xyxev44c@/ip4/127.0.0.1/tcp/5001/p2p/12D3KooWPZAF1y8x7ACEcnfmXJAkkmuVmpuf7WQEF5DPCYdyAkpk
function replacePeerOperatorAddress(peerP2PAddr: string, newaddr: Bech32String): string {
    const parts = peerP2PAddr.split("@")
    return newaddr + "@" + parts[1]
}
