import { JSON } from "json-as/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { NodePorts } from "wasmx-consensus/assembly/types_multichain"

export const CHAIN_IDS = "chainids"
export const LAST_NODE_PORTS = "lastnodeports"
export const NODE_PORTS = "nodeports."

export function getChainPortKey(chainId: string): string {
    return `${NODE_PORTS}${chainId}`
}

export function setNodePorts(chainId: string, ports: NodePorts): void {
    const key = getChainPortKey(chainId)
    wasmxw.sstore(key, JSON.stringify<NodePorts>(ports));
}

export function getNodePorts(chainId: string): NodePorts | null {
    const key = getChainPortKey(chainId)
    const value = wasmxw.sload(key);
    if (value == "") return null;
    return JSON.parse<NodePorts>(value);
}

export function setLastNodePorts(ports: NodePorts): void {
    wasmxw.sstore(LAST_NODE_PORTS, JSON.stringify<NodePorts>(ports));
}

export function getLastNodePorts(): NodePorts | null {
    const value = wasmxw.sload(LAST_NODE_PORTS);
    if (value == "") return null;
    return JSON.parse<NodePorts>(value);
}

export function addChainId(data: string): void {
    const ids = getChainIds()
    if (ids.includes(data)) {
        return
    }
    ids.push(data)
    return wasmxw.sstore(CHAIN_IDS, JSON.stringify<string[]>(ids));
}

export function getChainIds(): string[] {
    const value = wasmxw.sload(CHAIN_IDS);
    if (value == "") return [];
    return JSON.parse<string[]>(value);
}

export function setChainIds(data: string[]): void {
    return wasmxw.sstore(CHAIN_IDS, JSON.stringify<string[]>(data));
}
