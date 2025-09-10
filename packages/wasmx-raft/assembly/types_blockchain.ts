import { JSON } from "json-as";
import * as consw from "wasmx-env/assembly/crosschain_wrap";
import {HexString, Base64String, Bech32String, MsgIsAtomicTxInExecutionRequest} from 'wasmx-env/assembly/types';
import { Version, BlockID } from 'wasmx-consensus/assembly/types_tendermint';
import { LoggerDebug } from "./utils";

@json
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
    validator_address: HexString
    validator_privkey: Base64String
    validator_pubkey: Base64String

    constructor(chain_id: string, version: Version, app_hash: string, last_block_id: BlockID, last_commit_hash: string, last_results_hash: string, validator_address: HexString, validator_privkey: Base64String, validator_pubkey: Base64String) {
        this.chain_id = chain_id
        this.version = version
        this.app_hash = app_hash
        this.last_block_id = last_block_id
        this.last_commit_hash = last_commit_hash
        this.last_results_hash = last_results_hash
        this.validator_address = validator_address
        this.validator_privkey = validator_privkey
        this.validator_pubkey = validator_pubkey
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
    tempsize: i32 = 200
    map: Map<Base64String,MempoolTx> = new Map<Base64String,MempoolTx>()
    temp: Map<Base64String,bool> = new  Map<Base64String,bool>()
    tobesent: Map<Base64String,bool> = new  Map<Base64String,bool>()
    constructor(map: Map<Base64String,MempoolTx>, tempsize: i32 = 200) {
        this.tempsize = tempsize
        this.map = map;
        this.temp = new Map<Base64String,bool>()
    }

    hasseen(txhash: Base64String): bool {
        return this.temp.has(txhash) || this.map.has(txhash);
    }

    seen(txhash: Base64String): void {
        this.temp.set(txhash, true);
    }

    add(txhash: Base64String, tx: Base64String, gas: u64, leaderChainId: string): void {
        this.map.set(txhash, new MempoolTx(tx, gas, leaderChainId))
        this.tobesent.set(txhash, true)
    }

    remove(txhash: Base64String): void {
        this.map.delete(txhash)
        this.dropseen()
        // should be cleared by now; remove happens in finalize block
        // so by then we should have already sent the tx to other nodes
        this.tobesent.delete(txhash);
    }

    mustbesent(txhash: Base64String): boolean {
        if (!this.tobesent.has(txhash)) return false;
        this.tobesent.delete(txhash);
        return true;
    }

    clearmustbesent(): void {
        this.tobesent.clear()
    }

    dropseen(): void {
        // clear out temporary txhashes too if they get > 200
        // this.temp = new Map<Base64String,bool>()
        const todelete = this.temp.size - this.tempsize
        if (todelete < 1) return;
        const keys = this.temp.keys();
        // AS orders by insertion time, so we delete the first ones
        for (let i = 0; i < todelete; i++) {
            this.temp.delete(keys[i])
        }
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
