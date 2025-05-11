import { JSON } from "json-as";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as consw from "wasmx-env/assembly/crosschain_wrap";
import {HexString, Base64String, Bech32String, MsgIsAtomicTxInExecutionRequest} from 'wasmx-env/assembly/types';
import { Version, BlockID, CommitSig, BlockIDFlag } from 'wasmx-consensus/assembly/types_tendermint';
import { BigInt } from "wasmx-env/assembly/bn";
import { LoggerDebug } from "./utils";

@json
export class ValidatorQueueEntry {
    address: Bech32String // operator_address
    index: i32
    value: BigInt
    constructor(address: Bech32String, index: i32, value: BigInt) {
        this.address = address
        this.index = index
        this.value = value
    }
}

@json
export class GetProposerResponse {
    proposerQueue: ValidatorQueueEntry[]
    proposerIndex: i32
    constructor(proposerQueue: ValidatorQueueEntry[], proposerIndex: i32) {
        this.proposerQueue = proposerQueue
        this.proposerIndex = proposerIndex
    }
}

@json
export class CurrentState {
    chain_id: string = ""
    unique_p2p_id: string = "" // temporary fix for level0 unique chat rooms; TODO unique chain ids for level0
    version: Version = new Version(new typestnd.VersionConsensus(0, 0),"")
	app_hash: Base64String = "" // updated after Finalized Block
    // prev block info
    last_block_id: BlockID = new BlockID("", new typestnd.PartSetHeader(1, "")) // updated after Finalized Block
    // commit from validators from the last block
    last_commit_hash: Base64String = ""
    // tx results hash
    last_results_hash: Base64String = ""
    last_round: i64 = 0
    last_block_signatures: CommitSig[] = []
    last_time: string = "" // last block time

    validator_address: HexString = ""
    validator_privkey: Base64String = ""
    validator_pubkey: Base64String = ""

    nextHeight: i64 = 0
    nextHash: Base64String = "" // "" or hash

    lockedValue: i64 = 0
    lockedRound: i64 = 0
    validValue: i64 = 0
    validRound: i64 = 0
    proposerQueue: ValidatorQueueEntry[] = []
    proposerQueueTermId: i64 = 0
    proposerIndex: i32 = 0

    constructor(chain_id: string, version: Version, app_hash: Base64String, last_block_id: BlockID, last_commit_hash: Base64String, last_results_hash: Base64String, last_round: i64, last_block_signatures: CommitSig[], last_time: string, validator_address: HexString, validator_privkey: Base64String, validator_pubkey: Base64String,
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
        this.last_time = last_time
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
        this.unique_p2p_id = ""
    }
}

@json
class MempoolBatch {
    txs: Base64String[];
    cummulatedGas: i64;
    isAtomicTx: boolean
    isLeader: boolean
    full: boolean = false
    constructor(txs: Base64String[] = [], cummulatedGas: i64 = 0, isAtomicTx: boolean = false, isLeader: boolean = false) {
        this.txs = txs;
        this.cummulatedGas = cummulatedGas;
        this.isAtomicTx = isAtomicTx;
        this.isLeader = isLeader;
        this.full = false;
    }
}

@json
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

@json
export class Mempool {
    map: Map<Base64String,MempoolTx>
    temp: Map<Base64String,bool>
    constructor(map: Map<Base64String,MempoolTx>) {
        this.map = map;
        this.temp = new Map<Base64String,bool>()
    }

    seen(txhash: Base64String): void {
        this.temp.set(txhash, true);
    }

    add(txhash: Base64String, tx: Base64String, gas: u64, leaderChainId: string): void {
        this.map.set(txhash, new MempoolTx(tx, gas, leaderChainId))
    }

    remove(txhash: Base64String): void {
        this.map.delete(txhash)

        // clear out temporary txhashes too
        this.temp = new Map<Base64String,bool>()
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

    // quick check to see if we have enough tx in mempool
    isBatchFull(maxGas: i64, maxBytes: i64): boolean {
        if (maxGas == -1) return false;
        let cummulatedGas: i64 = 0;
        let cummulatedBytes: i64 = 0;
        const txhashes = this.map.keys();
        for (let i = 0; i < txhashes.length; i++) {
            const tx = this.map.get(txhashes[i])
            if (maxGas < (cummulatedGas + tx.gas)) {
                return true;
            }
            const bytelen = base64Len(tx.tx);
            if (maxBytes < (cummulatedBytes + bytelen)) {
                return true;
            }
            cummulatedGas += tx.gas;
            cummulatedBytes += bytelen;
        }
        if ((maxGas - cummulatedGas) < 50000) return true;
        if ((maxBytes - cummulatedBytes) < 1000) return true;
        return false;
    }
}

// 4 chars represent 3 bytes
function base64Len(value: Base64String): i32 {
    return i32(Math.ceil(value.length / 4)) * 3;
}
