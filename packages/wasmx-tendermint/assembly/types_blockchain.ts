import { JSON } from "json-as/assembly";
import * as consw from "wasmx-env/assembly/crosschain_wrap";
import {HexString, Base64String, Bech32String, MsgIsAtomicTxInExecutionRequest} from 'wasmx-env/assembly/types';
import { Version, BlockID, CommitSig, BlockIDFlag } from 'wasmx-consensus/assembly/types_tendermint';
import { BigInt } from "wasmx-env/assembly/bn";
import { LoggerDebug } from "./utils";

// @ts-ignore
@serializable
export class ValidatorQueueEntry {
    address: Bech32String
    index: i32
    value: BigInt
    constructor(address: Bech32String, index: i32, value: BigInt) {
        this.address = address
        this.index = index
        this.value = value
    }
}

// @ts-ignore
@serializable
export class CurrentState {
    chain_id: string
    version: Version
	app_hash: string // updated after Finalized Block
    // prev block info
    last_block_id: BlockID // updated after Finalized Block
    // commit from validators from the last block
    last_commit_hash: string // base64
    // tx results hash
    last_results_hash: string // base64
    last_round: i64
    last_block_signatures: CommitSig[]

    validator_address: HexString
    validator_privkey: Base64String
    validator_pubkey: Base64String

    nextHeight: i64
    nextHash: Base64String

    lockedValue: i64
    lockedRound: i64
    validValue: i64
    validRound: i64
    proposerQueue: ValidatorQueueEntry[]
    proposerQueueTermId: i64
    proposerIndex: i32

    constructor(chain_id: string, version: Version, app_hash: string, last_block_id: BlockID, last_commit_hash: string, last_results_hash: string, last_round: i64, last_block_signatures: CommitSig[], validator_address: HexString, validator_privkey: Base64String, validator_pubkey: Base64String,
    nextHeight: i64,
    nextHash: Base64String,
    lockedValue: i64,
    lockedRound: i64,
    validValue: i64,
    validRound: i64,
    proposerQueue: ValidatorQueueEntry[],
    proposerQueueTermId: i64,
    proposerIndex: i32,
    ) {
        this.chain_id = chain_id
        this.version = version
        this.app_hash = app_hash
        this.last_block_id = last_block_id
        this.last_commit_hash = last_commit_hash
        this.last_round = last_round
        this.last_block_signatures = last_block_signatures
        this.last_results_hash = last_results_hash
        this.validator_address = validator_address
        this.validator_privkey = validator_privkey
        this.validator_pubkey = validator_pubkey
        this.nextHeight = nextHeight
        this.nextHash = nextHash
        this.lockedValue = lockedValue
        this.lockedRound = lockedRound
        this.validValue = validValue
        this.validRound = validRound
        this.proposerQueue = proposerQueue
        this.proposerQueueTermId = proposerQueueTermId
        this.proposerIndex = proposerIndex
    }
}

// @ts-ignore
@serializable
class MempoolBatch {
    txs: Base64String[];
    cummulatedGas: i64;
    isAtomicTx: boolean
    isLeader: boolean
    constructor(txs: Base64String[] = [], cummulatedGas: i64 = 0, isAtomicTx: boolean = false, isLeader: boolean = false) {
        this.txs = txs;
        this.cummulatedGas = cummulatedGas;
        this.isAtomicTx = isAtomicTx;
        this.isLeader = isLeader;
    }
}

// @ts-ignore
@serializable
export class MempoolTx {
    tx: Base64String
    gas: u64
    leader: string = ""
    constructor(
        tx: Base64String,
        gas: u64,
        leader: string = "",
    ) {
        this.tx = tx
        this.gas = gas
        this.leader = leader
    }
}

// @ts-ignore
@serializable
export class Mempool {
    map: Map<Base64String,MempoolTx>
    constructor(map: Map<Base64String,MempoolTx>) {
        this.map = map;
    }

    add(txhash: Base64String, tx: Base64String, gas: u64, leaderChainId: string): void {
        this.map.set(txhash, new MempoolTx(tx, gas, leaderChainId))
    }

    remove(txhash: Base64String): void {
        this.map.delete(txhash)
    }

    batch(maxGas: i64, maxBytes: i64, ourchain: string): MempoolBatch {
        let batch: MempoolBatch = new MempoolBatch([], 0, false, false);
        let cummulatedBytes: i64 = 0;
        const txhashes = this.map.keys();
        for (let i = 0; i < txhashes.length; i++) {
            const tx = this.map.get(txhashes[i])
            let atomicInExec = false
            if (tx.leader != "") {
                if (
                    tx.leader == ourchain ||
                    consw.isAtomicTxInExecution(new MsgIsAtomicTxInExecutionRequest(tx.leader, txhashes[i]))
                ) {
                    atomicInExec = true
                    if (tx.leader == ourchain) {
                        LoggerDebug("adding atomic tx to block proposal", ["leader", tx.leader, "txhash", txhashes[i]])
                        batch.isLeader = true
                    } else {
                        LoggerDebug("atomic tx is in execution on leader chain", ["leader", tx.leader, "txhash", txhashes[i]])
                    }
                    batch.txs = []
                    batch.cummulatedGas = 0;
                    batch.isAtomicTx = true;
                } else {
                    LoggerDebug("atomic tx is not in execution on leader chain, skipping...", ["leader", tx.leader, "txhash", txhashes[i]])
                    continue;
                }
            }
            if (maxGas > -1 && maxGas < (batch.cummulatedGas + tx.gas)) {
                break;
            }
            const bytelen = base64Len(tx.tx);
            if (maxBytes < (cummulatedBytes + bytelen)) {
                break;
            }
            batch.txs = batch.txs.concat([tx.tx]);
            batch.cummulatedGas += tx.gas;
            cummulatedBytes += bytelen;
            // only one atomic transaction per batch
            if (atomicInExec) return batch;
        }
        return batch;
    }
}

// 4 chars represent 3 bytes
function base64Len(value: Base64String): i32 {
    return i32(Math.ceil(value.length / 4)) * 3;
}
