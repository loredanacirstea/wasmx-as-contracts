import { JSON } from "json-as";
import { Base64String, Bech32String, PageRequest } from "wasmx-env/assembly/types";
import { ChatBlock } from "wasmx-chat/assembly/types"

export const MODULE_NAME = "chat"

@json
export class MsgStoreConversation {
    blocks: ChatBlock[]
    constructor(blocks: ChatBlock[]) {
        this.blocks = blocks
    }
}

@json
export class QueryVerifyConversation {
    blocks: ChatBlock[]
    constructor(blocks: ChatBlock[]) {
        this.blocks = blocks
    }
}
