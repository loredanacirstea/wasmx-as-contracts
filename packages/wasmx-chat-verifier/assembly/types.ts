import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, PageRequest } from "wasmx-env/assembly/types";
import { ChatBlock } from "wasmx-chat/assembly/types"

export const MODULE_NAME = "chat"

// @ts-ignore
@serializable
export class MsgStoreConversation {
    blocks: ChatBlock[]
    constructor(blocks: ChatBlock[]) {
        this.blocks = blocks
    }
}

// @ts-ignore
@serializable
export class QueryVerifyConversation {
    blocks: ChatBlock[]
    constructor(blocks: ChatBlock[]) {
        this.blocks = blocks
    }
}
