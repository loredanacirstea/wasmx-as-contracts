import { JSON } from "json-as/assembly";
import { MsgAddSubChainId, QuerySubChainIds, QuerySubChainIdsResponse } from "./types";
import { addChainId, getChainIds } from "./storage";

export function addSubChainId(req: MsgAddSubChainId): ArrayBuffer {
    addChainId(req.id);
    return new ArrayBuffer(0)
}

export function getSubChainIds(req: QuerySubChainIds): ArrayBuffer {
    const ids = getChainIds();
    return String.UTF8.encode(JSON.stringify<QuerySubChainIdsResponse>(new QuerySubChainIdsResponse(ids)))
}
