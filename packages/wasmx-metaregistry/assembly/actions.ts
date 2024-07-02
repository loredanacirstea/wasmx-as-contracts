import { JSON } from "json-as/assembly";
import { ChainConfigData, MsgSetChainDataRequest, MsgSetChainDataResponse, QueryGetChainDataRequest, QueryGetChainDataResponse, QueryGetSubChainRequest } from "./types";
import { getChainData, setChainData } from "./storage";
import { HookCalld } from "./calldata";
import { ChainConfig, ChainId, NewSubChainDeterministicData } from "wasmx-consensus/assembly/types_multichain";
import * as base64 from "as-base64/assembly";

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

export function NewSubChain(req: HookCalld): void {
    const datastr = String.UTF8.decode(base64.decode(req.data).buffer);
    const data = JSON.parse<NewSubChainDeterministicData>(datastr);
    const chainId = ChainId.fromString(data.init_chain_request.chain_id)
    setChainData(new ChainConfigData(data.chain_config, chainId))
}
