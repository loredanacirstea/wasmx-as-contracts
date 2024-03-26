import { JSON } from "json-as/assembly";
import { validateBlock, validateConsecutiveBlocks } from "wasmx-chat/assembly/block";
import { MsgStoreConversation, QueryVerifyConversation } from "./types";
import { revert } from "./utils";
import { ChatBlock } from "wasmx-chat/assembly/types";
import { VerifyCosmosTxResponse } from "wasmx-env/assembly/types";

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

export function verifyConversationInternal(blocks: ChatBlock[]): VerifyCosmosTxResponse {
    if (blocks.length == 0) {
        return new VerifyCosmosTxResponse(true, "");
    }
    let previousBlock = blocks[0]
    const validResp = validateBlock(previousBlock)
    if (!validResp.valid) {
        return validResp
    }
    for (let i = 1; i < blocks.length; i++) {
        const validResp = validateBlock(blocks[i])
        if (!validResp.valid) return validResp;
        const validCR = validateConsecutiveBlocks(previousBlock, blocks[i]);
        if (!validCR.valid) return validCR;
        previousBlock = blocks[i];
    }
    return new VerifyCosmosTxResponse(true, "");
}

