import { JSON } from "json-as/assembly";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import {HexString, Base64String, Bech32String} from 'wasmx-env/assembly/types';
import { Version, BlockID, CommitSig, BlockIDFlag } from 'wasmx-consensus/assembly/types_tendermint';
import { BigInt } from "wasmx-env/assembly/bn";
import * as staking from "wasmx-stake/assembly/types";
import { ValidatorQueueEntry } from "wasmx-tendermint/assembly/types_blockchain";

// @ts-ignore
@serializable
export class GetProposerResponse {
    proposerQueue: ValidatorQueueEntry[]
    proposerIndex: i32
    constructor(proposerQueue: ValidatorQueueEntry[], proposerIndex: i32) {
        this.proposerQueue = proposerQueue
        this.proposerIndex = proposerIndex
    }
}

// @ts-ignore
@serializable
class MempoolBatch {
    txs: Base64String[];
    cummulatedGas: i64;
    constructor(txs: Base64String[] = [], cummulatedGas: i64 = 0) {
        this.txs = txs;
        this.cummulatedGas = cummulatedGas;
    }
}

// @ts-ignore
@serializable
export class Mempool {
    txs: Base64String[];
    gas: i32[];
    constructor(txs: Base64String[] = [], gas: i32[] = []) {
        this.txs = txs;
        this.gas = gas;
    }

    add(tx: Base64String, gas: i32): void {
        this.gas = this.gas.concat([gas]);
        this.txs = this.txs.concat([tx]);
    }

    batch(maxGas: i64, maxBytes: i64): MempoolBatch {
        let batch: MempoolBatch = new MempoolBatch([], 0);
        let cummulatedBytes: i64 = 0;
        for (let i = 0; i < this.txs.length; i++) {
            if (maxGas > -1 && maxGas < (batch.cummulatedGas + this.gas[i])) {
                break;
            }
            const bytelen = base64Len(this.txs[i]);
            if (maxBytes < (cummulatedBytes + bytelen)) {
                break;
            }
            batch.txs = batch.txs.concat([this.txs[i]]);
            batch.cummulatedGas += this.gas[i];
            cummulatedBytes += bytelen;
        }
        this.txs.splice(0, batch.txs.length);
        this.gas.splice(0, batch.txs.length);
        return batch;
    }

    spliceTxs(limit: i32): Base64String[] {
        return this.txs.splice(0, limit);
    }
}

// @ts-ignore
@serializable
export enum SignedMsgType {
    SIGNED_MSG_TYPE_UNKNOWN = 0,
    SIGNED_MSG_TYPE_PREVOTE = 1,
    SIGNED_MSG_TYPE_PRECOMMIT = 2,
    SIGNED_MSG_TYPE_PROPOSAL = 3
}

// @ts-ignore
@serializable
export class ValidatorProposalVote {
    type: SignedMsgType
    termId: i64
    validatorAddress: Bech32String
    validatorIndex: i32
    index: i64
    hash: Base64String
    timestamp: Date
    chainId: string
    constructor(type: SignedMsgType, termId: i64, validatorAddress: Bech32String, validatorIndex: i32, index: i64, hash: Base64String, timestamp: Date, chainId: string) {
        this.type = type
        this.termId = termId
        this.validatorAddress = validatorAddress
        this.validatorIndex = validatorIndex
        this.index = index
        this.hash = hash
        this.timestamp = timestamp
        this.chainId = chainId
    }
}

// @ts-ignore
@serializable
export class ValidatorProposalVoteMap {
    nodeCount: i32
    map: Map<i64,ValidatorProposalVote[]> = new Map<i64,ValidatorProposalVote[]>()
    constructor(nodeCount: i32) {
        this.nodeCount = nodeCount
        this.map = new Map<i64,ValidatorProposalVote[]>()
    }

    resize(validators: staking.ValidatorSimple[]): void {
        const newsize = validators.length;
        if (newsize < this.nodeCount) return;
        this.nodeCount = newsize
        const keys = this.map.keys()
        for (let i = 0; i < keys.length; i++) {
            const arr = this.map.get(keys[i])
            let termId: i64 = 0;
            let nextIndex: i64 = 0;
            if (arr.length > 0) {
                termId = arr[0].termId;
                nextIndex = arr[0].index;
            }
            const newarr = getEmptyValidatorProposalVoteArray(newsize, nextIndex, termId, SignedMsgType.SIGNED_MSG_TYPE_PREVOTE)
            // copy old array
            for (let j = 0; j < arr.length; j++) {
                newarr[j] = arr[j]
            }
            for (let j = arr.length; j < newsize; j++) {
                newarr[j].validatorAddress = validators[j].operator_address
            }
            this.map.set(keys[i], arr)
        }
    }

    removeLowerHeights(height: i64): void {
        const keys = this.map.keys()
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            if (key <= height) {
                this.map.delete(key)
            }
        }
    }
}

// @ts-ignore
@serializable
export class ValidatorCommitVote {
    vote: ValidatorProposalVote
    block_id_flag: BlockIDFlag
    signature: Base64String
    constructor(vote: ValidatorProposalVote, block_id_flag: BlockIDFlag, signature: Base64String) {
        this.vote = vote
        this.block_id_flag = block_id_flag
        this.signature = signature
    }
}

// @ts-ignore
@serializable
export class ValidatorCommitVoteMap {
    nodeCount: i32
    map: Map<i64,ValidatorCommitVote[]> = new Map<i64,ValidatorCommitVote[]>()
    constructor(nodeCount: i32) {
        this.nodeCount = nodeCount
        this.map = new Map<i64,ValidatorCommitVote[]>()
    }
    resize(validators: staking.ValidatorSimple[]): void {
        const newsize = validators.length;
        if (newsize < this.nodeCount) return;
        this.nodeCount = newsize
        const keys = this.map.keys()
        for (let i = 0; i < keys.length; i++) {
            const arr = this.map.get(keys[i])
            let termId: i64 = 0;
            let nextIndex: i64 = 0;
            if (arr.length > 0) {
                termId = arr[0].vote.termId;
                nextIndex = arr[0].vote.index;
            }
            const newarr = getEmptyPrecommitArray(newsize, nextIndex, termId, SignedMsgType.SIGNED_MSG_TYPE_PRECOMMIT)
            // copy old array
            for (let j = 0; j < arr.length; j++) {
                newarr[j] = arr[j]
            }
            for (let j = arr.length; j < newsize; j++) {
                newarr[j].vote.validatorAddress = validators[j].operator_address
            }
            this.map.set(keys[i], arr)
        }
    }

    removeLowerHeights(height: i64): void {
        const keys = this.map.keys()
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            if (key <= height) {
                this.map.delete(key)
            }
        }
    }
}

// @ts-ignore
@serializable
export class Commit {
    index: i64
    termId: i64
    hash: Base64String
    signatures: Base64String[] // we can put Precommit sigs here in validator order
    data: Base64String // LogEntryAggregate
    constructor(index: i64, termId: i64, hash: Base64String, signatures: Base64String[], data: Base64String) {
        this.index = index
        this.termId = termId
        this.hash = hash
        this.signatures = signatures
        this.data = data
    }
}

// 4 chars represent 3 bytes
function base64Len(value: Base64String): i32 {
    return i32(Math.ceil(value.length / 4)) * 3;
}

export function getEmptyValidatorProposalVoteArray(len: i32, nextIndex: i64, termId: i64, type: SignedMsgType): Array<ValidatorProposalVote> {
    const emptyPrevotes = new Array<ValidatorProposalVote>(len);
    for (let i = 0; i < len; i++) {
        emptyPrevotes[i] = new ValidatorProposalVote(type, termId, "", i, nextIndex, "", new Date(Date.now()), "");
    }
    return emptyPrevotes
}

export function getEmptyPrecommitArray(len: i32, nextIndex: i64, termId: i64, type: SignedMsgType): Array<ValidatorCommitVote> {
    const emptyCommits = new Array<ValidatorCommitVote>(len);
    for (let i = 0; i < len; i++) {
        const vote = new ValidatorProposalVote(type, termId, "", i, nextIndex, "", new Date(Date.now()), "");
        emptyCommits[i] = new ValidatorCommitVote(vote, typestnd.BlockIDFlag.Absent, "");
    }
    return emptyCommits
}
