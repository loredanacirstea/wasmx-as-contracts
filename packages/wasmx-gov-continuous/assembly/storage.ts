import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { DepositVote, Params, Proposal } from "./types";
import { PARAM_KEY, PROPOSAL_KEY, getProposalIdCount, getProposalIdLast, getProposalVoteCount, getProposalVoteKey, setProposalIdCount, setProposalIdLast } from "wasmx-gov/assembly/storage";

export const PARAM_LOCAL_KEY = "local_params"

// proposal_id => vote_id => vote GET
export function getProposalVote(proposal_id: u64, vote_id: u64): DepositVote | null {
    const value = wasmxw.sload(getProposalVoteKey(proposal_id, vote_id));
    if (value === "") return null;
    return JSON.parse<DepositVote>(value);
}

// proposal_id => vote_id => vote SET
export function setProposalVote(proposal_id: u64, vote_id: u64, value: DepositVote): void {
    const data = JSON.stringify<DepositVote>(value);
    wasmxw.sstore(getProposalVoteKey(proposal_id, vote_id), data);
}

// proposal_id => vote_id => vote ADD
export function addProposalVote(proposal_id: u64, value: DepositVote): u64 {
    const vote_id = getProposalVoteCount(proposal_id)
    setProposalVote(proposal_id, vote_id, value)
    return vote_id
}

// proposal_id => Proposal GET
export function getProposal(id: u64): Proposal | null {
    const value = wasmxw.sload(PROPOSAL_KEY + id.toString());
    if (value === "") return null;
    return JSON.parse<Proposal>(value);
}

// proposal_id => Proposal DELETE
export function removeProposal(id: u64): void {
    wasmxw.sstore(PROPOSAL_KEY + id.toString(), "");
}

// proposal_id => Proposal SET
export function setProposal(id: u64, value: Proposal): void {
    const data = JSON.stringify<Proposal>(value);
    wasmxw.sstore(PROPOSAL_KEY + id.toString(), data);
}

// proposal_id => Proposal ADD
export function addProposal(value: Proposal): u64 {
    const id = getProposalIdLast() + 1;
    value.id = id;
    setProposal(id, value)
    setProposalIdLast(id);
    setProposalIdCount(getProposalIdCount() + 1);
    return id;
}

export function getParams(): Params {
    const value = wasmxw.sload(PARAM_LOCAL_KEY);
    return JSON.parse<Params>(value);
}

export function getParamsInternal(): string {
    return wasmxw.sload(PARAM_LOCAL_KEY);
}

export function setParams(params: Params): void {
    return wasmxw.sstore(PARAM_LOCAL_KEY, JSON.stringify<Params>(params));
}
