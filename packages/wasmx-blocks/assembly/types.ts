import { JSON } from "json-as";
import {Base64String, Bech32String } from 'wasmx-env/assembly/types';

export const MODULE_NAME = "blocks"

@json
export class BlockEntry {
    index: i64;
    // TODO hash: string
    readerContract: Base64String
    writerContract: Base64String
    // in tendermint, data is {txs: tx[]}
    data: Base64String; // base64-encoded RequestProcessProposalWithMetaInfo
    header: Base64String // base64-encoded Header
    proposer_address: Bech32String // operator address
    last_commit: Base64String // base64-encoded BlockCommit
    evidence: Base64String // base64-encoded EvidenceData
    result: string // base64-encoded BlockFinalizeResult - same as ResponseFinalizeBlock
    validator_info: Base64String // base64-encoded TendermintValidators - validator set for this block
    constructor(index: i64, readerContract: Bech32String, writerContract: Bech32String, data: Base64String, header: Base64String, proposer_address: Bech32String, last_commit: Base64String, evidence: Base64String, result: string, validator_info: Base64String) {
        this.index = index;
        this.readerContract = readerContract;
        this.writerContract = writerContract;
        this.data = data;
        this.header = header;
        this.proposer_address = proposer_address;
        this.last_commit = last_commit;
        this.evidence = evidence;
        this.result = result;
        this.validator_info = validator_info;
    }
}

@json
export class IndexedTransaction {
    height: i64
	index: u32
    constructor(height: i64, index: u32) {
        this.height = height;
        this.index = index;
    }
}

@json
export class ConsensusParamsInfo {
    height: i64
    last_height_changed: i64
    params: Base64String // base64 encoded JSON stringified consensus params
    constructor(height: i64, last_height_changed: i64, params: Base64String) {
        this.height = height
        this.last_height_changed = last_height_changed
        this.params = params;
    }
}
