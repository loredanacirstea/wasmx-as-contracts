import { JSON } from "json-as/assembly";
import { validateBlock, validateConsecutiveBlocks } from "wasmx-chat/assembly/block";
import { MsgStoreConversation, QueryVerifyConversation } from "./types";
import { revert } from "./utils";
import { ChatBlock } from "wasmx-chat/assembly/types";

export function storeConversation(req: MsgStoreConversation): void {
    const valid = verifyConversationInternal(req.blocks);
    if (!valid) {
        revert(`invalid conversation`)
    }
    // TODO store conversation
}

export function verifyConversation(req: QueryVerifyConversation): ArrayBuffer {
    const valid = verifyConversationInternal(req.blocks);
    const arr = new Uint8Array(1);
    arr.set([0], 0);
    if (valid) {
        arr.set([1], 0);
    }
    return arr.buffer;
}

export function verifyConversationInternal(blocks: ChatBlock[]): bool {
    if (blocks.length == 0) return true;
    let previousBlock = blocks[0]
    if (!validateBlock(previousBlock)) return false;
    for (let i = 1; i < blocks.length; i++) {
        const valid = validateBlock(blocks[i])
        if (!valid) return false;
        if (!validateConsecutiveBlocks(previousBlock, blocks[i])) return false;
        previousBlock = blocks[i];
    }
    return true;
}

