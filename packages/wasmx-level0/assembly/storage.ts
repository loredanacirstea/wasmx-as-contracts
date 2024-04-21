import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as types from "wasmx-blocks/assembly/types";
import { getBlockHashKey, getBlockKey, getLastBlockIndex, setIndexedTransactionByHash, setLastBlockIndex, getBlockByIndex as _getBlockByIndex } from "wasmx-blocks/assembly/storage";
import { revert } from "./utils";
import { Block } from "./types";
import { getEmtpyBlock } from "./block";

export const chainId = "level0_667-1"; // TODO params
export const MEMBERS_KEY = "members_"

export function setMembers(): void {}

export function getLastBlockByIndex(): Block {
    const lastBlockIndex = getLastBlockIndex();
    const lastBlock = _getBlockByIndex(lastBlockIndex);
    if (lastBlock == "") {
        return getEmtpyBlock(chainId)
    }
    return JSON.parse<Block>(lastBlock);
}

export function setBlock(block: Block): void {
    const index = getLastBlockIndex() + 1;
    if (block.header.index != index) {
        revert(`cannot store block with index ${block.header.index.toString()}; expected ${index.toString()}`)
    }

    // store block
    const blockValue = JSON.stringify<Block>(block);
    wasmxw.sstore(getBlockKey(index), blockValue);

    // index block by hash
    wasmxw.sstore(getBlockHashKey(block.hash), index.toString());

    // index transactions
    for (let i = 0; i < block.data_hashes.length; i++) {
        const data = new types.IndexedTransaction(index, i);
        setIndexedTransactionByHash(block.data_hashes[i], data);
    }

    // update last index
    setLastBlockIndex(index);
}
