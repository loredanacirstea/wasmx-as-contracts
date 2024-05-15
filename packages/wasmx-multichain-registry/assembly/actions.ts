import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as roles from "wasmx-env/assembly/roles";
import * as utils from "wasmx-utils/assembly/utils";
import * as authtypes from "wasmx-auth/assembly/types";
import * as banktypes from "wasmx-bank/assembly/types";
import * as stakingtypes from "wasmx-stake/assembly/types";
import { GenesisState, GenutilGenesis, InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import { Base64String, Bech32String, CallRequest, CallResponse, Coin, Event, EventAttribute, PublicKey, SignedTransaction } from "wasmx-env/assembly/types";
import { AttributeKeyChainId, AttributeKeyRequest, EventTypeInitSubChain } from "./events";
import { addChainId, addChainValidator, getChainData, getChainIds, getChainValidatorAddresses, getChainValidators, getParams, setChainData } from "./storage";
import { CosmosmodGenesisState, InitSubChainRequest, MODULE_NAME, MODULE_NAME_COSMOSMOD, QueryGetSubChainIdsRequest, QueryGetSubChainRequest, QueryGetSubChainsRequest, RegisterSubChainRequest, RegisterSubChainValidatorRequest, RemoveSubChainRequest, SubChainData } from "./types";
import { revert } from "./utils";
import { BigInt } from "wasmx-env/assembly/bn";

// TODO: permission!! only one of the validators can call InitSubChain for a level1 chain
export function InitSubChain(req: InitSubChainRequest): ArrayBuffer {
    initSubChainInternal(req.chainId)
    return new ArrayBuffer(0);
}

export function RegisterSubChain(req: RegisterSubChainRequest): ArrayBuffer {
    if (!passCheckEIDActive(wasmxw.getCaller())) {
        revert(`unauthorized: no eID active`);
    }
    registerSubChainInternal(req.data, req.genTxs, req.balances)
    return new ArrayBuffer(0);
}

export function RegisterSubChainValidator(req: RegisterSubChainValidatorRequest): ArrayBuffer {
    if (!passCheckEIDActive(wasmxw.getCaller())) {
        revert(`unauthorized: no eID active`);
    }
    registerSubChainValidatorInternal(req.chainId, req.genTx);
    return new ArrayBuffer(0);
}

export function RemoveSubChain(req: RemoveSubChainRequest): ArrayBuffer {
    removeSubChain(req.chainId)
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

export function registerSubChainInternal(data: InitSubChainDeterministicRequest, genTxs: Base64String[], balances: Coin[]): void {
    addChainId(data.init_chain_request.chain_id);
    const chaindata = new SubChainData(data, genTxs, balances);
    setChainData(chaindata);
    for (let i = 0; i < genTxs.length; i++) {
        registerSubChainValidatorInternal(data.init_chain_request.chain_id, genTxs[i]);
    }
}

export function registerSubChainValidatorInternal(chainId: string, genTx: Base64String): void {
    // we verify the transaction when the subchain is started
    let genTxStr = String.UTF8.decode(base64.decode(genTx).buffer)
    const tx = JSON.parse<SignedTransaction>(genTxStr)
    const msg = extractCreateValidatorMsg(tx)
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
    setChainData(chaindata);
}

export function removeSubChain(chainId: string): void {
    // TODO only first validator can remove this
    // only if not initialized
}

export function initSubChainInternal(chainId: string): void {
    const params = getParams()
    const chaindata = getChainData(chainId)
    if (chaindata == null) {
        revert(`subchain not registered: ${chainId}`);
        return;
    }
    if (chaindata.genTxs.length < params.min_validators_count) {
        revert(`subchain needs at least ${params.min_validators_count} validators; has ${chaindata.genTxs.length}`)
    }

    // only the first validator can execute this
    const addr = getChainValidatorAddresses(chainId)
    const caller = wasmxw.getCaller()
    if (!wasmxw.addr_equivalent(caller, addr[0])) {
        revert(`unauthorized: caller ${caller}, validator ${addr[0]}`)
    }

    // we emit a subchain event
    chaindata.data.init_chain_request.time = new Date(Date.now()).toISOString()

    const genTxs = getChainValidators(chainId)
    const newChainInit = includeGenTxs(chaindata, genTxs)
    chaindata.data = newChainInit;
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
}

export function extractCreateValidatorMsg(tx: SignedTransaction): stakingtypes.MsgCreateValidator | null {
    const msgany = tx.body.messages[0]
    if (msgany.type_url != stakingtypes.TypeUrl_MsgCreateValidator) {
        return null;
    }
    const msgstr = String.UTF8.decode(base64.decode(msgany.value).buffer)
    const msg = JSON.parse<stakingtypes.MsgCreateValidator>(msgstr)
    return msg;
}

export function includeGenTxs(data: SubChainData, genTxs: Base64String[]): InitSubChainDeterministicRequest {
    const appstate = utils.base64ToString(data.data.init_chain_request.app_state_bytes)
    const genesisState: GenesisState = JSON.parse<GenesisState>(appstate)

    // update genutil
    const genutil = new GenutilGenesis(genTxs)
    const genutilData = utils.stringToBase64(JSON.stringify<GenutilGenesis>(genutil))
    genesisState.set("genutil", genutilData)

    // update bank balances & create auth accounts
    if (!genesisState.has(MODULE_NAME_COSMOSMOD)) {
        revert(`genesis state missing field: ${MODULE_NAME_COSMOSMOD}`)
    }
    const cosmosmodGenesisStr = utils.base64ToString(genesisState.get(MODULE_NAME_COSMOSMOD))
    const cosmosmodGenesis = JSON.parse<CosmosmodGenesisState>(cosmosmodGenesisStr)
    const bankGenesis = cosmosmodGenesis.bank
    const authGenesis = cosmosmodGenesis.auth


    // bankGenesis.balances
    for (let i = 0; i < genTxs.length; i++) {
        const genTx = genTxs[i]
        let genTxStr = utils.base64ToString(genTx)
        const tx = JSON.parse<SignedTransaction>(genTxStr)
        const msg = extractCreateValidatorMsg(tx)
        if (msg == null) {
            continue;
        }
        // new balance
        const balance = new banktypes.Balance(msg.validator_address, data.balances)
        bankGenesis.balances.push(balance);
        // new account
        if (tx.auth_info.signer_infos.length == 0) {
            revert(`genTx transaction has empty signer_infos`)
        }
        const signer = tx.auth_info.signer_infos[0]

        // we set account number 0, because it is updated when wasmx-auth initGenesis is ran
        const signerPubKey = signer.public_key;
        let accPubKey: PublicKey | null = null;
        if (signerPubKey != null) {
            accPubKey = new PublicKey(signerPubKey.type_url, signerPubKey.value)
        }
        const account = new authtypes.BaseAccount(msg.validator_address, accPubKey, 0, 0)
        let encoded = JSON.stringify<authtypes.BaseAccount>(account)
        const accountAny = authtypes.NewBaseAccount(authtypes.TypeUrl_BaseAccount, encoded);
        authGenesis.accounts.push(accountAny);
    }

    cosmosmodGenesis.bank = bankGenesis
    cosmosmodGenesis.auth = authGenesis
    const newcosmosmodGenesisStr = utils.stringToBase64(JSON.stringify<CosmosmodGenesisState>(cosmosmodGenesis))

    genesisState.set(MODULE_NAME_COSMOSMOD, newcosmosmodGenesisStr)
    const newGenesisState = JSON.stringify<GenesisState>(genesisState)
    data.data.init_chain_request.app_state_bytes = utils.stringToBase64(newGenesisState);
    return data.data;
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

export function callEvmContract(addr: Bech32String, calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest(addr, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.callEvm(req, MODULE_NAME);
    return resp;
}
