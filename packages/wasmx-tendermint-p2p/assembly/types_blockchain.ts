import { JSON } from "json-as/assembly";
import {HexString, Base64String, Bech32String} from 'wasmx-env/assembly/types';
import { Version, BlockID } from 'wasmx-consensus/assembly/types_tendermint';

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
export class Prevote {
    sender: Bech32String
    index: i64
    hash: Base64String
    constructor(sender: Bech32String, index: i64, hash: Base64String) {
        this.sender = sender
        this.index = index
        this.hash = hash
    }
}

// @ts-ignore
@serializable
export class Precommit {
    sender: Bech32String
    index: i64
    hash: Base64String
    constructor(sender: Bech32String, index: i64, hash: Base64String) {
        this.sender = sender
        this.index = index
        this.hash = hash
    }
}

// 4 chars represent 3 bytes
function base64Len(value: Base64String): i32 {
    return i32(Math.ceil(value.length / 4)) * 3;
}
