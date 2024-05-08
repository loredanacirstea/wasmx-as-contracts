import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import * as constypes from "./types_tendermint"
import * as mc from "./multichain";
import { InitSubChainMsg } from "./types_multichain";

export function InitSubChain(req: InitSubChainMsg): constypes.ResponseInitChain {
    const resp = mc.InitSubChain(String.UTF8.encode(JSON.stringify<InitSubChainMsg>(req)));
    return JSON.parse<constypes.ResponseInitChain>(String.UTF8.decode(resp));
}
