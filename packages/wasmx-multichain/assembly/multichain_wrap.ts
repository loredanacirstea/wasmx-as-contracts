import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as constypes from "wasmx-consensus/assembly/types_tendermint"
import * as mc from "./multichain";
import { InitChainMsg } from "./types";

export function InitChain(req: InitChainMsg): constypes.ResponseInitChain {
    const resp = mc.InitChain(String.UTF8.encode(JSON.stringify<InitChainMsg>(req)));
    return JSON.parse<constypes.ResponseInitChain>(String.UTF8.decode(resp));
}
