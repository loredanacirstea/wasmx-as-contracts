import { JSON } from "json-as/assembly";
import { Bech32String } from "wasmx-env/assembly/types";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { DepositVote, Params, Proposal } from "wasmx-gov-continuous/assembly/types";
import { PARAM_KEY, PROPOSAL_KEY, PROPOSAL_VOTER_KEY, SPLIT, getProposalIdCount, getProposalIdLast, getProposalVoteCount, getProposalVoteKey, setProposalIdCount, setProposalIdLast } from "wasmx-gov/assembly/storage";

export const PROPOSAL_VOTE_KEY = "proposal_vote."

// key.proposal_id.voter
export function getProposalVoterKey(proposal_id: u64, voter: Bech32String): string {
    return PROPOSAL_VOTER_KEY + proposal_id.toString() + SPLIT + voter
}
