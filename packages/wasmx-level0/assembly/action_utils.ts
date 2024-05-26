import { getPrecommitArray } from "wasmx-tendermint-p2p/assembly/storage";
import { ValidatorProposalVote } from "wasmx-tendermint-p2p/assembly/types_blockchain";
import { LoggerDebug } from "./utils";

export function isPrecommitAcceptThreshold(hash: string): boolean {
    const precommitArr = getPrecommitArray();
    const votes = new Array<ValidatorProposalVote>(precommitArr.length);
    for (let i = 0; i < precommitArr.length; i++) {
        votes[i] = precommitArr[i].vote;
    }
    return calculateVote(votes, hash)
}

export function isPrecommitAnyThreshold(): boolean {
    const precommitArr = getPrecommitArray();
    const votes = new Array<ValidatorProposalVote>(precommitArr.length);
    for (let i = 0; i < precommitArr.length; i++) {
        votes[i] = precommitArr[i].vote;
    }
    return calculateVote(votes, "")
}

export function calculateVote(votePerNode: Array<ValidatorProposalVote>, hash: string): boolean {
    const max = votePerNode.length
    const threshold = u32(Math.ceil(f32(max) * 80 / 100));
    let count: u32 = 0;
    for (let i = 0; i < votePerNode.length; i++) {
        if (hash == "") { // any vote
            if (votePerNode[i].hash != "") {
                count += 1;
            }
        } else if (votePerNode[i].hash == hash) {
            count += 1;
        }
    }
    LoggerDebug("calculate vote", ["max", max.toString(), "threshold", threshold.toString(), "value", count.toString()])
    return count >= threshold;
}
