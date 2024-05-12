import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as roles from "wasmx-env/assembly/roles";
import * as utils from "wasmx-utils/assembly/utils";
import { GenesisState, GenutilGenesis, InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import { Base64String, Bech32String, CallRequest, CallResponse, Coin, Event, EventAttribute } from "wasmx-env/assembly/types";
import { AttributeKeyChainId, AttributeKeyRequest, EventTypeInitSubChain } from "./events";
import { addChainId, addChainValidator, getChainData, getChainIds, getChainValidators, getParams, setChainData } from "./storage";
import { InitSubChainRequest, MODULE_NAME, QueryGetSubChainIdsRequest, QueryGetSubChainRequest, QueryGetSubChainsRequest, RegisterSubChainRequest, RegisterSubChainValidatorRequest, RemoveSubChainRequest, SubChainData } from "./types";
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
    // TODO only the first validator can execute this

    // we emit a subchain event
    chaindata.data.init_chain_request.time = new Date(Date.now()).toISOString()

    const genTxs = getChainValidators(chainId)
    const newChainInit = includeGenTxs(chaindata, genTxs)
    chaindata.data = newChainInit;

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

export function registerSubChainInternal(data: InitSubChainDeterministicRequest, genTxs: Base64String[], balances: Coin[]): void {
    // we just store the chain configuration and emit a subchain event
    addChainId(data.init_chain_request.chain_id);
    const chaindata = new SubChainData(data, genTxs, balances);
    setChainData(chaindata);
    for (let i = 0; i < genTxs.length; i++) {
        registerSubChainValidatorInternal(data.init_chain_request.chain_id, genTxs[i]);
    }
}

export function registerSubChainValidatorInternal(chainId: string, genTx: Base64String): void {
    // TODO verify using subchain protocol
    const resp = wasmxw.verifyCosmosTx(genTx)
    if (!resp.valid) {
        revert(`invalid transaction signature: ${resp.error}`);
    }

    // const tx = JSON.parse<SignedTransaction>(genTx)
    // const msg = tx.body.messages[0].sender
    // decodeCosmosTx
    // TODO check validator address
    const validatorAddress = wasmxw.getCaller()

    addChainValidator(chainId, validatorAddress, genTx)

    // TODO get peer from genTx memo & add to chain data InitSubChainDeterministicRequest
}

export function removeSubChain(chainId: string): void {
    // TODO only first validator can remove this
}

export function includeGenTxs(data: SubChainData, genTxs: Base64String[]): InitSubChainDeterministicRequest {
    const genesisState: GenesisState = JSON.parse<GenesisState>(data.data.init_chain_request.app_state_bytes)

    const genutil = new GenutilGenesis(genTxs)
    const genutilData = JSON.stringify<GenutilGenesis>(genutil)

    genesisState.set("genutil", genutilData)

    const newGenesisState = JSON.stringify<GenesisState>(genesisState)
    data.data.init_chain_request.app_state_bytes = newGenesisState;
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
