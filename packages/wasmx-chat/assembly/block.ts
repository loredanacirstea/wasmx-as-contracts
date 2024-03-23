import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as base64decode } from "as-base64/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { ChatBlock, ChatHeader, ChatMessage, ChatRoom, MODULE_NAME } from './types';
import { Base64String, SignedTransaction, TxMessage } from 'wasmx-env/assembly/types';
import { base64ToString, i64ToUint8ArrayBE } from "wasmx-utils/assembly/utils";
import { revert } from "./utils";
import { getCallDataInternal } from "./calldata";

export function validateBlock(block: ChatBlock): bool {
    const dataHash = getTxHash(block.data);
    if (dataHash != block.header.data_hash) return false;

    // verify tx signature
    const tx = decodeTx(block.data)
    if (tx.signatures.length == 0) return false;
    // TODO verify tx signature
    return true;
}

export function validateConsecutiveBlocks(block: ChatBlock, blockNext: ChatBlock): bool {
    const blockHash = getBlockHeaderHash(block.header)
    if (blockHash != blockNext.header.parent_hash) return false;
    if ((block.header.height + 1) != blockNext.header.height) return false;
    if (block.header.time.getTime() > blockNext.header.time.getTime()) return false;
    return true;
}

export function buildBlock(room: ChatRoom, tx: Base64String): ChatBlock {
    const dataHash = getTxHash(tx);
    const header = new ChatHeader(room.last_block_height + 1, new Date(Date.now()), room.last_block_hash, dataHash);
    return new ChatBlock(header, tx);
}

export function getTxHash(tx: Base64String): string {
    return wasmxw.MerkleHash([tx]);
}

export function getBlockHeaderHash(header: ChatHeader): Base64String {
    const data = [
        header.data_hash,
        encodeBase64(i64ToUint8ArrayBE(header.height)),
        header.parent_hash,
        encodeBase64(Uint8Array.wrap(String.UTF8.encode(header.time.toISOString()))),
    ]
    return wasmxw.MerkleHash(data);
}

export function decodeTx(tx: Base64String): SignedTransaction {
    return wasmxw.decodeCosmosTxToJson(base64decode(tx).buffer);
}

export function parseTx(tx: Base64String): TxMessage | null {
    const decoded = wasmxw.decodeCosmosTxToJson(base64decode(tx).buffer);
    if (decoded.body.messages.length == 0) return null;
    const msg = decoded.body.messages[0]
    if (msg.contract != wasmxw.getAddress()) {
      revert(`${MODULE_NAME} cannot handle tx sent to ${msg.contract}`);
      return null;
    }
    return msg;
}

export function getChatMessageFromBlock(block: ChatBlock): ChatMessage | null {
    const parsedTx = parseTx(block.data)
    if (!parsedTx) return null;
    const calld = getCallDataInternal(base64ToString(parsedTx.msg.data));
    if (calld.JoinRoom) {
        const req = calld.JoinRoom!;
        return new ChatMessage(req.roomId, `${parsedTx.sender} joined room`, block.header.time, parsedTx.sender)
    } else if (calld.SendMessage) {
        const req = calld.SendMessage!;
        return new ChatMessage(req.roomId, req.message, block.header.time, parsedTx.sender);
    }
    return null;
}
