import { JSON } from "json-as";
import * as base64 from "as-base64/assembly";
import * as constypes from "./types_tendermint"
import * as mc from "./multichain";
import { InitSubChainMsg, StartStateSyncRequest, StartStateSyncResponse, StartSubChainMsg, StartSubChainResponse } from "./types_multichain";
import { LoggerDebug, LoggerDebugExtended } from "./consensus_wrap";

export function InitSubChain(req: InitSubChainMsg): constypes.ResponseInitChain {
    const data = JSON.stringify<InitSubChainMsg>(req)
    LoggerDebugExtended("InitSubChain", ["request", data]);
    const resp = mc.InitSubChain(String.UTF8.encode(data));
    const respdata = String.UTF8.decode(resp)
    LoggerDebugExtended("InitSubChain", ["response", respdata]);
    return JSON.parse<constypes.ResponseInitChain>(respdata);
}

export function StartSubChain(req: StartSubChainMsg): StartSubChainResponse {
    const data = JSON.stringify<StartSubChainMsg>(req)
    LoggerDebugExtended("StartSubChain", ["request", data]);
    const resp = mc.StartSubChain(String.UTF8.encode(data));
    const respdata = String.UTF8.decode(resp)
    LoggerDebugExtended("StartSubChain", ["response", respdata]);
    return JSON.parse<StartSubChainResponse>(respdata);
}

export function GetSubChainIds(): string[] {
    const resp = mc.GetSubChainIds();
    const respdata = String.UTF8.decode(resp)
    LoggerDebug("GetSubChainIds", ["response", respdata]);
    return JSON.parse<string[]>(respdata);
}

export function StartStateSync(req: StartStateSyncRequest): StartStateSyncResponse {
    const data = JSON.stringify<StartStateSyncRequest>(req)
    LoggerDebugExtended("StartStateSync", ["request", data]);
    const resp = mc.StartStateSync(String.UTF8.encode(data));
    const respdata = String.UTF8.decode(resp)
    LoggerDebugExtended("StartSubChain", ["response", respdata]);
    return JSON.parse<StartStateSyncResponse>(respdata);
}
