import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { HookCalld } from 'wasmx-env/assembly/hooks';
import { MsgAddSubChainId, MsgInitialize, MsgSetInitialPorts, MsgStartStateSync, QueryNodePortsPerChainId, QuerySubChainIds, QuerySubChainIdsWithPorts } from "./types";

// @ts-ignore
@serializable
export class CallData {
    AddSubChainId: MsgAddSubChainId | null = null;
    SetInitialPorts: MsgSetInitialPorts | null = null;
    StartStateSync: MsgStartStateSync | null = null;

    // query
    GetSubChainIds: QuerySubChainIds | null = null;
    GetNodePortsPerChainId: QueryNodePortsPerChainId | null = null;
    GetSubChainIdsWithPorts: QuerySubChainIdsWithPorts | null = null;

    // consensusless hooks
    StartNode: HookCalld | null = null;
    NewSubChain: HookCalld | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataInitialize(): MsgInitialize {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<MsgInitialize>(calldstr);
}
