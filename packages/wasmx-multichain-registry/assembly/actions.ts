import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { InitSubChainDeterministicRequest } from "wasmx-consensus/assembly/types_multichain";
import { Event, EventAttribute } from "wasmx-env/assembly/types";
import { AttributeKeyChainId, AttributeKeyRequest, EventTypeInitSubChain } from "./events";
import { setChainData } from "./storage";

export function InitSubChain(req: InitSubChainDeterministicRequest): ArrayBuffer {
    initSubChainInternal(req)
    return new ArrayBuffer(0);
}

export function initSubChainInternal(req: InitSubChainDeterministicRequest): void {
    // we just store the chain configuration and emit a subchain event
    req.init_chain_request.time = new Date(Date.now()).toISOString()
    setChainData(req);
    const data = JSON.stringify<InitSubChainDeterministicRequest>(req);
    const data64 = base64.encode(Uint8Array.wrap(String.UTF8.encode(data)))
    const ev = new Event(
        EventTypeInitSubChain,
        [
            new EventAttribute(AttributeKeyChainId, req.init_chain_request.chain_id, true),
            new EventAttribute(AttributeKeyRequest, data64, false),
        ],
    )
    wasmxw.emitCosmosEvents([ev]);
}
