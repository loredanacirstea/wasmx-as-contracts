import { JSON } from "json-as/assembly";
import * as wasmxt from "wasmx-env/assembly/types";
import * as wasmx from "wasmx-env/assembly/wasmx";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as roles from "wasmx-env/assembly/roles";
import * as cross from "wasmx-env/assembly/crosschain";
import * as crossw from "wasmx-env/assembly/crosschain_wrap";
import { ChainConfig, ChainId, InitSubChainMsg, NewSubChainDeterministicData } from "wasmx-consensus/assembly/types_multichain";
import * as level0 from "wasmx-consensus/assembly/level0"
import * as utils from "wasmx-utils/assembly/utils"
import { ChainConfigData, CROSS_CHAIN_TIMEOUT_MS, MsgSetChainDataRequest, MsgSetChainDataResponse, QueryGetChainDataRequest, QueryGetChainDataResponse, QueryGetSubChainRequest, QueryGetSubChainsByIdsRequest, QuerySubChainConfigByIdsRequest } from "./types";
import { getChainData, setChainData } from "./storage";
import { CallData, HookCalld } from "./calldata";
import * as base64 from "as-base64/assembly";
import { LoggerError, LoggerInfo } from "./utils";

export function SetChainData(req: MsgSetChainDataRequest): ArrayBuffer {
    setChainData(req.data);
    const encoded = JSON.stringify<MsgSetChainDataResponse>(new MsgSetChainDataResponse())
    return String.UTF8.encode(encoded)
}

export function GetChainData(req: QueryGetChainDataRequest): ArrayBuffer {
    const data = getChainData(req.chain_id)
    if (data == null) {
        return new ArrayBuffer(0)
    }
    const encoded = JSON.stringify<QueryGetChainDataResponse>(new QueryGetChainDataResponse(data))
    return String.UTF8.encode(encoded)
}

export function GetSubChainConfigById(req: QueryGetSubChainRequest): ArrayBuffer {
    const data = getChainData(req.chainId)
    if (data == null) {
        return new ArrayBuffer(0)
    }
    const encoded = JSON.stringify<ChainConfig>(data.config)
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

export function NewSubChain(req: HookCalld): void {
    const datastr = String.UTF8.decode(base64.decode(req.data).buffer);
    const data = JSON.parse<InitSubChainMsg>(datastr);
    // only init_chain_request, chain_config are deterministic
    // so limit to this
    const chainId = ChainId.fromString(data.init_chain_request.chain_id)
    const configdata = new ChainConfigData(data.chain_config, chainId)
    setChainData(configdata)

    // send this hook data to level0
    if (!wasmxw.getChainId().includes(level0.Level0ChainId.base_name)) {
        LoggerInfo("forwarding subchain config to level0", ["subchain_id", chainId.full])
        const msg = new CallData()
        msg.SetChainData = new MsgSetChainDataRequest(configdata)
        const msgstr = JSON.stringify<CallData>(msg)
        const ccreq = level0CrossChainCallRequest(msgstr)
        const resp = crossw.executeCrossChainTxNonDeterministic(ccreq);
        if (resp.error.length > 0) {
            LoggerError("forwarding subchain config to level0 failed", ["subchain_id", chainId.full, "error", resp.error])
        }
    }
}

export function level0CrossChainCallRequest(msg: string): wasmxt.MsgCrossChainCallRequest {
    const sender = wasmx.getAddress()
    const senderBech32 = wasmxw.addr_humanize(sender)
    const from = wasmxw.addr_humanize_mc(String.UTF8.encode(senderBech32), level0.Bech32PrefixAccAddr)
    // TODO replace with metaregistry role address
    // const to = wasmxw.addr_humanize_mc(sender, level0.Bech32PrefixAccAddr);
    const to = roles.ROLE_METAREGISTRY
    // TODO be able to send a request to the last version of a chain, by its base name
    // without knowing the current chain id
    const req = new wasmxt.MsgCrossChainCallRequest(to, utils.stringToBase64(msg), [], [], level0.Level0ChainId.full, CROSS_CHAIN_TIMEOUT_MS)
    // req.from = from
    req.from = roles.ROLE_METAREGISTRY
    req.from_chain_id = wasmxw.getChainId()
    return req
}

export function prepareCrossChainCallRequest(req: wasmxt.MsgCrossChainCallRequest): wasmxt.MsgCrossChainCallRequest | null {
    const caller = wasmx.getCaller()
    const callerBech32 = wasmxw.addr_humanize(caller)
    const toChainConfig = subChainConfigById(req.to_chain_id)
    if (toChainConfig == null) {
        return null;
    }
    req.from_chain_id = wasmxw.getChainId()
    req.from = wasmxw.addr_humanize_mc(String.UTF8.encode(callerBech32), toChainConfig.Bech32PrefixAccAddr)

    // if address does not have the correct prefix, we convert it
    const toAddr = wasmxw.addr_canonicalize_mc(req.to)
    if (toAddr.prefix != toChainConfig.Bech32PrefixAccAddr) {
        req.to = wasmxw.addr_humanize_mc(base64.decode(toAddr.bz).buffer, toChainConfig.Bech32PrefixAccAddr);
    }
    return req
}

export function convertAddress(sourceAddr: string, prefix: string): string {
    const addr = wasmxw.addr_canonicalize_mc(sourceAddr)
    return wasmxw.addr_humanize_mc(base64.decode(addr.bz).buffer, prefix);
}

export function subChainConfigById(chainId: string): ChainConfig | null {
    const chaindata = getChainData(chainId)
    if (chaindata == null) {
        return null
    }
    return chaindata.config
}
