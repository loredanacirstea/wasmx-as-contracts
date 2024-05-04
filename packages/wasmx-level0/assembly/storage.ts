import { JSON } from "json-as/assembly";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as types from "wasmx-blocks/assembly/types";
import { getBlockHashKey, getBlockKey, getLastBlockIndex, setIndexedTransactionByHash, setLastBlockIndex, getBlockByIndex as _getBlockByIndex } from "wasmx-blocks/assembly/storage";
import * as cfg from "./config";
import { revert } from "./utils";
import { Block, CurrentState } from "./types";
import { getEmtpyBlock } from "./block";

export const MEMBERS_KEY = "members_"

export function setMembers(): void {}

export function getLastBlock(): Block {
    const lastBlockIndex = getLastBlockIndex();
    const lastBlock = _getBlockByIndex(lastBlockIndex);
    if (lastBlock == "") {
        return getEmtpyBlock()
    }
    return JSON.parse<Block>(lastBlock);
}

export function getLastBlockByIndex(index: i64): Block {
    const lastBlock = _getBlockByIndex(index);
    if (lastBlock == "") {
        return getEmtpyBlock()
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

export function getCurrentState(): CurrentState {
    const value = fsm.getContextValue(cfg.STATE_KEY);
    // this must be set before we try to read it
    if (value === "") {
        revert("chain init setup was not ran")
    }
    return JSON.parse<CurrentState>(value);
}

export function setCurrentState(value: CurrentState): void {
    fsm.setContextValue(cfg.STATE_KEY, JSON.stringify<CurrentState>(value));
}

export function getCurrentValidator(): typestnd.ValidatorInfo {
    const currentState = getCurrentState();
    // TODO voting_power & proposer_priority
    return new typestnd.ValidatorInfo(currentState.validator_address, currentState.validator_pubkey, 0, 0);
}
