import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as roles from "wasmx-env/assembly/roles";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as wasmxt from "wasmx-env/assembly/types";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as mcwrap from 'wasmx-consensus/assembly/multichain_wrap';
import * as mctypes from "wasmx-consensus/assembly/types_multichain";
import * as level0 from "wasmx-consensus/assembly/level0"
import * as crossw from "wasmx-env/assembly/crosschain_wrap";
import * as utils from "wasmx-utils/assembly/utils"
import { ChainConfig, ChainId, InitSubChainDeterministicRequest, InitSubChainMsg, NewSubChainDeterministicData, NodePorts, StartSubChainMsg } from "wasmx-consensus/assembly/types_multichain"
import { CROSS_CHAIN_TIMEOUT_MS, MODULE_NAME, MsgAddSubChainId, MsgSetInitialPorts, MsgStartStateSync, QueryNodePortsPerChainId, QueryNodePortsPerChainIdResponse, QuerySubChainIds, QuerySubChainIdsResponse, QuerySubChainIdsWithPorts, QuerySubChainIdsWithPortsResponse } from "./types";
import { addChainId, CHAIN_IDS, getChainIds, getLastNodePorts, getNodePorts, setLastNodePorts, setNodePorts } from "./storage";
import { LoggerError, LoggerInfo, revert } from "./utils";
import { callContract } from "wasmx-env/assembly/utils";
import { HookCalld } from "wasmx-env/assembly/hooks";
import { CallData } from "./calldata";

const REGISTRY_ROLE = roles.ROLE_METAREGISTRY;

export function setInitialPorts(req: MsgSetInitialPorts): ArrayBuffer {
    setLastNodePorts(req.initialPorts)
    return new ArrayBuffer(0)
}

export function addSubChainId(req: MsgAddSubChainId): ArrayBuffer {
    addSubChainIdInternal(req.id)
    return new ArrayBuffer(0)
}

export function getSubChainIds(req: QuerySubChainIds): ArrayBuffer {
    const ids = getChainIds();
    return String.UTF8.encode(JSON.stringify<QuerySubChainIdsResponse>(new QuerySubChainIdsResponse(ids)))
}

export function getNodePortsPerChainId(req: QueryNodePortsPerChainId): ArrayBuffer {
    let portlist = getNodePorts(req.chain_id);
    if (portlist == null) {
        portlist = new NodePorts();
    }
    return String.UTF8.encode(JSON.stringify<QueryNodePortsPerChainIdResponse>(new QueryNodePortsPerChainIdResponse(portlist)))
}

export function getSubChainIdsWithPorts(req: QuerySubChainIdsWithPorts): ArrayBuffer {
    const ids = getChainIds();
    const ports = getSubChainIdsWithPortsInternal(ids)
    return String.UTF8.encode(JSON.stringify<QuerySubChainIdsWithPortsResponse>(new QuerySubChainIdsWithPortsResponse(ids, ports)))
}

export function addSubChainIdInternal(id: string): NodePorts {
    addChainId(id);
    let portlist = new NodePorts();
    const lastPorts = getLastNodePorts();
    if (lastPorts != null) {
        portlist = lastPorts.increment();
    }
    setLastNodePorts(portlist);
    setNodePorts(id, portlist);
    return portlist;
}

export function getSubChainIdsWithPortsInternal(ids: string[]): NodePorts[] {
    const ports = new Array<NodePorts>(ids.length);
    for (let i = 0; i < ids.length; i++) {
        let portlist = getNodePorts(ids[i]);
        if (portlist == null) {
            portlist = new NodePorts();
        }
        ports[i] = portlist;
    }
    return ports
}

export function NewSubChain(req: HookCalld): void {
    const datastr = String.UTF8.decode(base64.decode(req.data).buffer);
    const data = JSON.parse<InitSubChainMsg>(datastr);
    const chainId = data.init_chain_request.chain_id

    // right now we only add the subchains on level0
    // so we just forward the data to level0
    // const portlist = addSubChainIdInternal(chainId)

    // if we are on level0, we instantiate & start the chain
    if (wasmxw.getChainId().includes(level0.Level0ChainId.base_name)) {
        const portlist = addSubChainIdInternal(chainId)

        // initialize the chain
        data.initial_ports = portlist
        LoggerInfo("initializing subchain", ["subchain_id", chainId])
        const response = mcwrap.InitSubChain(data);
        // TODO response?
        LoggerInfo("initialized subchain", ["subchain_id", chainId])

        LoggerInfo("starting subchain", ["subchain_id", chainId])
        startNode([chainId])
        LoggerInfo("started subchain", ["subchain_id", chainId])
    } else {
        // send this hook data to level0
        LoggerInfo("forwarding subchain config to level0", ["subchain_id", chainId])
        const msg = new CallData()
        msg.NewSubChain = req
        const msgstr = JSON.stringify<CallData>(msg)
        const ccreq = level0CrossChainCallRequest(msgstr)
        const resp = crossw.executeCrossChainTxNonDeterministic(ccreq);
        if (resp.error.length > 0) {
            LoggerError("forwarding subchain config to level0 failed", ["subchain_id", chainId, "error", resp.error])
        }
    }
}

export function StartNode(): void {
    const ids = getChainIds();
    startNode(ids)
}

export function startNode(ids: string[]): void {
    const portLists = getSubChainIdsWithPortsInternal(ids);

    // call chain registry & get all subchains & start each node
    const calldatastr = `{"GetSubChainConfigByIds":{"ids":${JSON.stringify<string[]>(ids)}}}`;
    const resp = callContract(REGISTRY_ROLE, calldatastr, true, MODULE_NAME);
    if (resp.success > 0) {
        // we do not fail, we want the chain to continue
        LoggerError(`call failed: could not start subchains`, ["contract", REGISTRY_ROLE, "error", resp.data])
        return
    }
    const configs = JSON.parse<ChainConfig[]>(resp.data);
    LoggerInfo("starting subchains", ["count", configs.length.toString()])

    if (configs.length != ids.length) {
        revert(`local registry port list length mismatch`)
    }

    for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        const id = ids[i];
        LoggerInfo("starting subchain", ["subchain_id", id])
        const ports = portLists[i];
        const resp = mcwrap.StartSubChain(new StartSubChainMsg(id, config, ports))
        if (resp.error.length > 0) {
            LoggerError("could not start subchain", ["subchain_id", id])
        }
    }
}

export function level0CrossChainCallRequest(msg: string): wasmxt.MsgCrossChainCallRequest {
    const sender = wasmx.getAddress()
    const senderBech32 = wasmxw.addr_humanize(sender)
    const from = wasmxw.addr_humanize_mc(String.UTF8.encode(senderBech32), level0.Bech32PrefixAccAddr)
    // TODO replace with metaregistry role address
    // const to = wasmxw.addr_humanize_mc(sender, level0.Bech32PrefixAccAddr);
    const to = roles.ROLE_MULTICHAIN_REGISTRY_LOCAL
    // TODO be able to send a request to the last version of a chain, by its base name
    // without knowing the current chain id
    const req = new wasmxt.MsgCrossChainCallRequest(to, utils.stringToBase64(msg), [], [], level0.Level0ChainId.full)
    req.timeout_ms = CROSS_CHAIN_TIMEOUT_MS
    // req.from = from
    req.from = roles.ROLE_MULTICHAIN_REGISTRY_LOCAL
    req.from_chain_id = wasmxw.getChainId()
    return req
}

export function StartStateSync(req: MsgStartStateSync): ArrayBuffer {
    // const response = wasmxw.grpcRequest(req.rpc, Uint8Array.wrap(contract), msgBase64);
    // if (response.error.length > 0 || response.data.length == 0) {
    //     return
    // }
    // const resp = JSON.parse<UpdateNodeResponse>(response.data);

    // const chainConf =
    stateSyncChain(req.chain_id, req.chain_config, req.peer_address, req.statesync_config)
    return new ArrayBuffer(0)
}

var StateSyncProtocolId = "statesync"

export function GetStateSyncProtocolId(chainId: string): string {
	return StateSyncProtocolId + "_" + chainId
}

export function stateSyncChain(chainId: string, chainConf: ChainConfig, peeraddr: string, statesyncConfig: mctypes.StateSyncConfig): void {
    const ports = addSubChainIdInternal(chainId)
    // we just give empty ports, because level0 controls the ports, not upper levels
    const initialPorts = NodePorts.empty()

    const response = mcwrap.StartStateSync(new mctypes.StartStateSyncRequest(GetStateSyncProtocolId(chainId), peeraddr, chainId, chainConf, ports, initialPorts, statesyncConfig))
    if (response.error.length > 0) {
        LoggerError("failed to start state sync as receiver", ["error", response.error]);
    }
}
