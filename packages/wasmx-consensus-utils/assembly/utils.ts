import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import * as consw from "wasmx-consensus/assembly/consensus_wrap";
import * as staking from "wasmx-stake/assembly/types";
import { hexToUint8Array32, uint8ArrayToHex, i64ToUint8ArrayBE, hex64ToBase64 } from "wasmx-utils/assembly/utils";
import { BigInt } from "wasmx-env/assembly/bn";
import { Base64String } from "wasmx-env/assembly/types";

// cosmos-sdk store values
// 128K - 1
export const MaxKeyLength = 131071
// 2G - 1
export const MaxValueLength = 2147483647

export function getValidatorsHash(validators: staking.Validator[]): string {
    const data = getActiveValidatorInfo(validators)
    return consw.ValidatorsHash(data);
}

export function getValidatorsHash2(validators: staking.Validator[]): string {
    let data = new Array<string>(validators.length);
    for (let i = 0; i < validators.length; i++) {
        // hex
        const key = validators[i].consensus_pubkey;
        let pub_key = new Uint8Array(32);
        if (key != null) {
            pub_key = decodeBase64(key.getKey().key);
        }
        // TODO we may only hash a part of these tokens - e.g. the power
        // depends on tendermint light client verification
        const tokens = validators[i].tokens.toU8ArrayBe()
        const newdata = new Uint8Array(pub_key.length + tokens.length);
        newdata.set(pub_key, 0);
        newdata.set(tokens, pub_key.length);
        data[i] = uint8ArrayToHex(newdata);
    }
    return wasmxw.MerkleHash(data);
}

export function isValidatorInactive(valid: staking.Validator): boolean {
    return valid.jailed || valid.status != staking.BondedS
}

export function getActiveValidatorInfo(validators: staking.Validator[]): typestnd.TendermintValidator[] {
    let vinfo = new Array<typestnd.TendermintValidator>(0);
    for (let i = 0; i < validators.length; i++) {
        const v = validators[i];
        if (isValidatorInactive(v)) {
            continue;
        }
        const consKey = v.consensus_pubkey;
        if (consKey == null) {
            wasmxw.revert(`validator missing consensus key ${v.operator_address}`)
            return [];
        }
        const key = consKey.getKey().key
        const addrhex = wasmxw.ed25519PubToHex(key)
        const votingPow = v.tokens.div(BigInt.fromU32(1000000)).toU64()
        const val = new typestnd.TendermintValidator(addrhex, consKey, votingPow, 0);
        vinfo.push(val);
    }
    return vinfo;
}

// Txs.Hash() -> [][]byte merkle.HashFromByteSlices
// base64
export function getTxsHash(txs: string[]): string {
    return wasmxw.MerkleHash(txs);
}

// Hash returns a hash of a subset of the parameters to store in the block header.
// Only the Block.MaxBytes and Block.MaxGas are included in the hash.
// This allows the ConsensusParams to evolve more without breaking the block
// protocol. No need for a Merkle tree here, just a small struct to hash.
// cometbft: cmtproto.HashedParams
export function getConsensusParamsHash(params: typestnd.ConsensusParams): Base64String {
    return consw.ConsensusParamsHash(params);
}

export function getConsensusParamsHash2(params: typestnd.ConsensusParams): string {
    const value = JSON.stringify<typestnd.BlockParams>(params.block);
    const hash = wasmx.sha256(String.UTF8.encode(value));
    return encodeBase64(Uint8Array.wrap(hash));
}

// []Evidence hash
// TODO
export function getEvidenceHash(params: typestnd.Evidence): string {
    return wasmxw.MerkleHash([]);
}

export function getCommitHash(lastCommit: typestnd.BlockCommit): string {
    // TODO MerkleHash(lastCommit.signatures)
    return wasmxw.MerkleHash([]);
}

export function getResultsHash(results: typestnd.ExecTxResult[]): string {
    const data = new Array<string>(results.length);
    for (let i = 0; i < results.length; i++) {
        data[i] = encodeBase64(Uint8Array.wrap(String.UTF8.encode(JSON.stringify<typestnd.ExecTxResult>(results[i]))));
    }
    return wasmxw.MerkleHash(data);
}

// Hash returns the hash of the header.
// It computes a Merkle tree from the header fields
// ordered as they appear in the Header.
// Returns nil if ValidatorHash is missing,
// since a Header is not valid unless there is
// a ValidatorsHash (corresponding to the validator set).
export function getHeaderHash(header: typestnd.Header): Base64String {
    return consw.HeaderHash(header);
}

export function getHeaderHash1(header: typestnd.Header): string {
    const versionbz = String.UTF8.encode(JSON.stringify<typestnd.VersionConsensus>(header.version));
    const blockidbz = String.UTF8.encode(JSON.stringify<typestnd.BlockID>(header.last_block_id));
    const data = [
        encodeBase64(Uint8Array.wrap(versionbz)),
        encodeBase64(Uint8Array.wrap(String.UTF8.encode(header.chain_id))),
        encodeBase64(i64ToUint8ArrayBE(header.height)),
        encodeBase64(Uint8Array.wrap(String.UTF8.encode(header.time))),
        encodeBase64(Uint8Array.wrap(blockidbz)),
        hex64ToBase64(header.last_commit_hash),
        hex64ToBase64(header.data_hash),
        hex64ToBase64(header.validators_hash),
        hex64ToBase64(header.next_validators_hash),
        hex64ToBase64(header.consensus_hash),
        hex64ToBase64(header.app_hash),
        hex64ToBase64(header.last_results_hash),
        hex64ToBase64(header.evidence_hash),
        hex64ToBase64(header.proposer_address), // TODO transform hex to base64
    ]
    return wasmxw.MerkleHash(data);
}

// ValidatorSet.Validators hash (ValidatorInfo[] hash)
// TODO cometbft protobuf encodes cmtproto.SimpleValidator
export function getValidatorsHash1(validators: typestnd.ValidatorInfo[]): string {
    let data = new Array<string>(validators.length);
    for (let i = 0; i < validators.length; i++) {
        // hex
        const consKey = validators[i].pub_key;
        const pub_key = hexToUint8Array32(consKey);
        const power = i64ToUint8ArrayBE(validators[i].voting_power);
        const newdata = new Uint8Array(pub_key.length + power.length);
        newdata.set(pub_key, 0);
        newdata.set(power, pub_key.length);
        data[i] = uint8ArrayToHex(newdata);
    }
    return wasmxw.MerkleHash(data);
}


export function getEventTopic(eventName: string, eventAttribute: string, eventValue: string): string {
    return `${eventName}.${eventAttribute}='${eventValue}'`
}

export function extractIndexedTopics(finalizeResp: typestnd.ResponseFinalizeBlock, txhashes: string[]): wblockscalld.IndexedTopic[] {
    const topicMap = new Map<string,string[]>()
    const indexed: wblockscalld.IndexedTopic[] = []
    for (let i = 0; i < finalizeResp.tx_results.length; i++) {
        const res = finalizeResp.tx_results[i]
        for (let j = 0; j < res.events.length; j++) {
            const ev = res.events[j]
            for (let n = 0; n < ev.attributes.length; n++) {
                const attr = ev.attributes[n]
                if (attr.index) {
                    const topic = getEventTopic(ev.type, attr.key, attr.value)
                    if (topic.length > MaxKeyLength) {
                        wasmxw.LoggerDebug("consensus-utils", "cannot index event attribute", ["type", ev.type, "attribute", attr.key, "error", "topic larger than MaxKeyLength", "MaxKeyLength", MaxKeyLength.toString()])
                        continue;
                    }
                    if (!topicMap.has(topic)) {
                        topicMap.set(topic, [])
                    }
                    const values = topicMap.get(topic)
                    values.push(txhashes[i]);
                    topicMap.set(topic, values)
                }
            }
            const topic = ev.type
            if (!topicMap.has(topic)) {
                topicMap.set(topic, [])
            }
            const values = topicMap.get(topic)
            values.push(txhashes[i]);
            topicMap.set(topic, values)
        }

    }
    const keys = topicMap.keys()
    for (let i = 0; i < keys.length; i++) {
        indexed.push(new wblockscalld.IndexedTopic(keys[i], topicMap.get(keys[i])))
    }
    return indexed
}
