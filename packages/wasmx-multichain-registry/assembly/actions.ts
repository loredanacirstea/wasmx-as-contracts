import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
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
import { ChainConfig, GenesisState, GenutilGenesis, InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import { buildChainConfig, buildChainId, getDefaultConsensusParams } from "wasmx-consensus/assembly/multichain_utils";
import * as wasmxt from "wasmx-env/assembly/types";
import { Base64String, Coin, SignedTransaction, Event, EventAttribute, PublicKey, Bech32String } from "wasmx-env/assembly/types";
import { AttributeKeyChainId, AttributeKeyRequest, AttributeKeyValidator, EventTypeInitSubChain, EventTypeRegisterSubChain, EventTypeRegisterSubChainValidator } from "./events";
import { addChainId, addChainValidator, addChainValidatorAddress, addLevelChainId, getChainData, getChainIds, getChainLastId, getChainValidatorAddresses, getChainValidators, getLevelChainIds, getParams, getValidatorChains, setChainData } from "./storage";
import { CosmosmodGenesisState, InitSubChainRequest, MODULE_NAME, QueryGetSubChainIdsByLevelRequest, QueryGetSubChainIdsByValidatorRequest, QueryGetSubChainIdsRequest, QueryGetSubChainRequest, QueryGetSubChainsByIdsRequest, QueryGetSubChainsRequest, QueryGetValidatorsByChainIdRequest, RegisterDefaultSubChainRequest, RegisterSubChainRequest, RegisterSubChainValidatorRequest, RemoveSubChainRequest, SubChainData, ValidatorInfo } from "./types";
import { LoggerInfo, revert } from "./utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { RequestInitChain } from "wasmx-consensus/assembly/types_tendermint";
import { Delegation, MsgCreateValidator, getValidatorFromMsgCreate } from "wasmx-stake/assembly/types";

export function InitSubChain(req: InitSubChainRequest): ArrayBuffer {
    LoggerInfo("initializing subchain", ["subchain_id", req.chainId])
    initSubChainInternal(req.chainId, true)
    LoggerInfo("initialized subchain", ["subchain_id", req.chainId])
    return new ArrayBuffer(0);
}

export function RegisterDefaultSubChain(req: RegisterDefaultSubChainRequest): ArrayBuffer {
    if (!passCheckEIDActive(wasmxw.getCaller())) {
        revert(`unauthorized: no eID active`);
    }
    LoggerInfo("start registering new default subchain", ["chain_base_name", req.chain_base_name])
    registerDefaultSubChainInternal(req);
    LoggerInfo("registered new default subchain", ["chain_base_name", req.chain_base_name])
    return new ArrayBuffer(0);
}

export function RegisterSubChain(req: RegisterSubChainRequest): ArrayBuffer {
    if (!passCheckEIDActive(wasmxw.getCaller())) {
        revert(`unauthorized: no eID active`);
    }
    registerSubChainInternal(req.data, req.genTxs, req.initial_balance)
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
    const chaindata = getChainData(req.chainId)
    if (chaindata == null) {
        return new ArrayBuffer(0)
    }
    const encoded = JSON.stringify<ChainConfig>(chaindata.data.chain_config)
    return String.UTF8.encode(encoded)
}

export function GetSubChainIdsByLevel(req: QueryGetSubChainIdsByLevelRequest): ArrayBuffer {
    const ids = getLevelChainIds(req.level);
    return String.UTF8.encode(JSON.stringify<string[]>(ids))
}

export function GetSubChainIdsByValidator(req: QueryGetSubChainIdsByValidatorRequest): ArrayBuffer {
    const ids = getValidatorChains(req.validator_address);
    return String.UTF8.encode(JSON.stringify<string[]>(ids))
}

export function GetValidatorsByChainId(req: QueryGetValidatorsByChainIdRequest): ArrayBuffer {
    const addrs = getChainValidators(req.chain_id);
    return String.UTF8.encode(JSON.stringify<string[]>(addrs))
}

export function tryRegisterUpperLevel(lastRegisteredLevel: i32, lastRegisteredChainId: string): void {
    const params = getParams()
    const levelchains = getLevelChainIds(lastRegisteredLevel)
    const count = levelchains.length;
    if (count % params.min_validators_count > 0) return;

    const nextLevel = lastRegisteredLevel + 1

    const upperlevels = getLevelChainIds(nextLevel);
    const expectedLevels = i32(count / params.min_validators_count);
    if (upperlevels.length >= expectedLevels) return;

    LoggerInfo("registering subchain", ["subchain_level", nextLevel.toString()])

    // we need to create another level
    const subchaindata = registerDefaultSubChainLevel(nextLevel);
    const newChainId = subchaindata.data.init_chain_request.chain_id
    LoggerInfo("registered subchain", ["subchain_level", nextLevel.toString(), "subchain_id", newChainId])

    LoggerInfo("registering subchain with validators", ["subchain_level", nextLevel.toString(), "subchain_id", newChainId])
    // subchains that will provide a validator each
    const subchainIds = levelchains.slice(count - params.min_validators_count)
    const valInfos: ValidatorInfo[] = []
    for (let i = 0; i < subchainIds.length; i++) {
        const valIndex = 0; // we take the first validator of each chain
        // TODO the algorithm whould rotate validators
        let valInfo = getChainValidatorInfoFromGenTx(lastRegisteredChainId, valIndex)
        if (valInfo == null) continue;
        const valAddr = wasmxw.addr_canonicalize_mc(valInfo.validator.validator_address)
        const newValidatorAddress = wasmxw.addr_humanize_mc(
            base64.decode(valAddr.bz).buffer,
            subchaindata.data.chain_config.Bech32PrefixAccAddr,
        )
        const newvalue = new Coin(
            subchaindata.data.chain_config.BaseDenom,
            // TODO take the staked amount or the default initial balance?
            valInfo.validator.value.amount,
        )
        const newmsg = new MsgCreateValidator(
            valInfo.validator.description,
            valInfo.validator.commission,
            valInfo.validator.min_self_delegation,
            newValidatorAddress,
            valInfo.validator.pubkey,
            newvalue,
        )
        const newValInfo = new ValidatorInfo(newmsg, valInfo.operator_pubkey, valInfo.p2p_address)
        valInfos.push(newValInfo);
    }
    subchaindata.data = includeValidatorInfos(subchaindata, valInfos)
    setChainData(subchaindata)

    LoggerInfo("initializing subchain", ["subchain_level", nextLevel.toString(), "subchain_id", newChainId])
    initSubChainInternal(newChainId, false)
    LoggerInfo("initialized subchain", ["subchain_level", nextLevel.toString(), "subchain_id", newChainId])
}

export function registerDefaultSubChainLevel(levelIndex: i32): SubChainData {
    const params = getParams()
    const denomUnit = `lvl${levelIndex}`
    const chainBaseName = "leveln"
    const req = new RegisterDefaultSubChainRequest(denomUnit, 18, chainBaseName, levelIndex, params.level_initial_balance, [])
    return registerDefaultSubChainInternal(req)
}

// TODO each level can create a chain for the next level only?
// so add the level number in genesis
export function registerDefaultSubChainInternal(req: RegisterDefaultSubChainRequest): SubChainData {
    const peers: string[] = [];
    const defaultInitialHeight: i64 = 1;
    const lastId = getChainLastId()
    const chainId = buildChainId(req.chain_base_name, req.level_index, lastId+1, 1)
    const consensusParams = getDefaultConsensusParams()
    const chainConfig = buildChainConfig(req.denom_unit, req.base_denom_unit, req.chain_base_name)

    const bootstrapAccountBech32 = wasmxw.addr_humanize_mc(utils.hexToUint8Array(modnames.ADDR_BOOTSTRAP_ACCOUNT).buffer, chainConfig.Bech32PrefixAccAddr)
    const feeCollectorBech32 =  wasmxw.addr_humanize_mc(utils.hexToUint8Array(modnames.ADDR_FEE_COLLECTOR).buffer, chainConfig.Bech32PrefixAccAddr)
    const mintBech32 =  wasmxw.addr_humanize_mc(utils.hexToUint8Array(modnames.ADDR_MINT).buffer, chainConfig.Bech32PrefixAccAddr)

    const genesisState = buildGenesisData(req.denom_unit, req.base_denom_unit, bootstrapAccountBech32, feeCollectorBech32, mintBech32)

    const appStateBz = utils.stringToBase64(JSON.stringify<GenesisState>(genesisState))

    const initChainReq = new RequestInitChain(
        new Date(Date.now()).toISOString(),
        chainId,
        consensusParams,
        [],
        appStateBz,
        defaultInitialHeight,
    )
    const data = new InitSubChainDeterministicRequest(initChainReq, chainConfig, peers);
    return registerSubChainInternal(data, req.gen_txs, req.initial_balance);
}

export function registerSubChainInternal(data: InitSubChainDeterministicRequest, genTxs: Base64String[], initialBalance: BigInt): SubChainData {
    const chainId = data.init_chain_request.chain_id
    addChainId(chainId);
    const initialLevel = 1;
    const chaindata = new SubChainData(data, genTxs, initialBalance, initialLevel);
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

export function initSubChainInternal(chainId: string, trynextlevel: boolean): void {
    const params = getParams()
    const chaindata = getChainData(chainId)
    if (chaindata == null) {
        revert(`subchain not registered: ${chainId}`);
        return;
    }

    // only the first validator can execute this
    const addr = getChainValidatorAddresses(chainId)
    if (addr.length < params.min_validators_count) {
        revert(`subchain needs at least ${params.min_validators_count} validators; has ${addr.length} addresses registered`)
    }
    const caller = wasmxw.getCaller()
    if (!wasmxw.addr_equivalent(caller, addr[0])) {
        revert(`unauthorized: caller ${caller}, validator ${addr[0]}`)
    }

    // we emit a subchain event
    chaindata.data.init_chain_request.time = new Date(Date.now()).toISOString()

    const genTxs = getChainValidators(chainId)

    const appstate = utils.base64ToString(chaindata.data.init_chain_request.app_state_bytes)
    let genesisState: GenesisState = JSON.parse<GenesisState>(appstate)
    genesisState = includeGenTxs(genesisState, genTxs, chaindata.initial_balance)

    const validatorCount = getValidatorCountFromGenesis(genesisState)
    if (validatorCount < params.min_validators_count) {
        revert(`subchain needs at least ${params.min_validators_count} validators; has ${validatorCount} registered in genesis`)
    }
    const newGenesisState = JSON.stringify<GenesisState>(genesisState)
    chaindata.data.init_chain_request.app_state_bytes = utils.stringToBase64(newGenesisState);

    chaindata.initialized = true;

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
    if (trynextlevel) {
        tryRegisterUpperLevel(chaindata.level, chainId)
    }
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

        cosmosmodGenesis = includeValidatorAccountInfo(cosmosmodGenesis, msg,  signer.public_key, initial_balance)
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

export function buildGenesisData(denomUnit: string, baseDenomUnit: u32, bootstrapAccountBech32: string, feeCollectorBech32: string, mintBech32: string): GenesisState {
    // validators are only added through genTxs
    const params = getParams()
    const bankGenesis = bankdefaults.getDefaultGenesis(denomUnit, baseDenomUnit, params.erc20CodeId, params.derc20CodeId)

    const gasBaseDenom = bankGenesis.denom_info[0].metadata.base
    const stakingBaseDenom = bankGenesis.denom_info[1].metadata.base
    const rewardsBaseDenom = bankGenesis.denom_info[2].metadata.base

    const stakingGenesis = stakingdefaults.getDefaultGenesis(stakingBaseDenom)
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

    const wasmxGenesis = wasmxdefaults.getDefaultGenesis(bootstrapAccountBech32, feeCollectorBech32, mintBech32)
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

export function getChainValidatorInfoFromGenTx(chainId: string, index: i32): (ValidatorInfo | null) {
    const genTxs = getChainValidators(chainId)
    if (genTxs.length <= index) {
        revert(`index out of bounds: ${index}, validator count ${genTxs.length}`)
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
    return new ValidatorInfo(msg, signer.public_key, tx.body.memo)
}

export function getChainValidatorInfoFromGenesis(chainId: string, index: i32): (ValidatorInfo | null) {
    const genTxs = getChainValidators(chainId)
    if (genTxs.length <= index) {
        revert(`index out of bounds: ${index}, validator count ${genTxs.length}`)
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
    return new ValidatorInfo(msg, signer.public_key, tx.body.memo)
}

export function includeValidatorAccountInfo(cosmosmodGenesis: CosmosmodGenesisState, msg: MsgCreateValidator, operatorPubKey: PublicKey | null, initial_balance: BigInt): CosmosmodGenesisState {
    const baseDenom = cosmosmodGenesis.bank.denom_info[0].metadata.base

    // new balance
    const balance = new banktypes.Balance(msg.validator_address, [new Coin(baseDenom, initial_balance)])
    cosmosmodGenesis.bank.balances.push(balance);

    // new account
    let accPubKey: PublicKey | null = null;
    if (operatorPubKey != null) {
        accPubKey = new PublicKey(operatorPubKey.type_url, operatorPubKey.value);
    }
    // we set account number 0, because it is updated when wasmx-auth initGenesis is ran
    const account = new authtypes.BaseAccount(msg.validator_address, accPubKey, 0, 0)
    let encoded = JSON.stringify<authtypes.BaseAccount>(account)
    const accountAny = AnyWrap.New(authtypes.TypeUrl_BaseAccount, encoded)
    cosmosmodGenesis.auth.accounts.push(accountAny);
    return cosmosmodGenesis;
}

export function includeValidatorInfos(data: SubChainData, validators: ValidatorInfo[]): InitSubChainDeterministicRequest {
    if (validators.length == 0) return data.data;
    const appstate = utils.base64ToString(data.data.init_chain_request.app_state_bytes)
    const genesisState: GenesisState = JSON.parse<GenesisState>(appstate)

    // update bank balances & create auth accounts
    if (!genesisState.has(modnames.MODULE_COSMOSMOD)) {
        revert(`genesis state missing field: ${modnames.MODULE_COSMOSMOD}`)
    }
    const cosmosmodGenesisStr = utils.base64ToString(genesisState.get(modnames.MODULE_COSMOSMOD))
    let cosmosmodGenesis = JSON.parse<CosmosmodGenesisState>(cosmosmodGenesisStr)

    const chainId = data.data.init_chain_request.chain_id
    for (let i = 0; i < validators.length; i++) {
        const vinfo = validators[i]
        const val = vinfo.validator
        addChainValidatorAddress(chainId, val.validator_address);
        cosmosmodGenesis = includeValidatorAccountInfo(cosmosmodGenesis, val, vinfo.operator_pubkey, data.initial_balance);

        // now also include staking validator info
        cosmosmodGenesis.staking.validators.push(getValidatorFromMsgCreate(val))
        cosmosmodGenesis.staking.delegations.push(new Delegation(
            vinfo.validator.validator_address,
            vinfo.validator.validator_address,
            vinfo.validator.value.amount,
        ))
    }
    const newcosmosmodGenesisStr = utils.stringToBase64(JSON.stringify<CosmosmodGenesisState>(cosmosmodGenesis))

    genesisState.set(modnames.MODULE_COSMOSMOD, newcosmosmodGenesisStr)
    const newGenesisState = JSON.stringify<GenesisState>(genesisState)
    data.data.init_chain_request.app_state_bytes = utils.stringToBase64(newGenesisState);
    return data.data;
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
