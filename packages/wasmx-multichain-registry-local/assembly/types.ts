import { JSON } from "json-as/assembly";

export const MODULE_NAME = "multichain_registry_local"

// @ts-ignore
@serializable
export class MsgInitialize {
    ids: string[]
    constructor(ids: string[]) {
        this.ids = ids
    }
}

// @ts-ignore
@serializable
export class MsgAddSubChainId {
    id: string
    constructor(id: string) {
        this.id = id
    }
}

// @ts-ignore
@serializable
export class QuerySubChainIds {}

// @ts-ignore
@serializable
export class QuerySubChainIdsResponse {
    ids: string[]
    constructor(ids: string[]) {
        this.ids = ids
    }
}
