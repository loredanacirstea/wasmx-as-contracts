import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { parseInt32, parseInt64 } from "wasmx-utils/assembly/utils";
import { Deposit, Params, Proposal, Vote } from "./types";
import { Bech32String } from "wasmx-env/assembly/types";

export const SPLIT = "."
export const PARAM_KEY = "params"
export const PROPOSAL_ID_LAST_KEY = "proposal_id_last"
export const PROPOSAL_ID_FIRST_KEY = "proposal_id_first"
export const PROPOSAL_ID_COUNT_KEY = "proposal_count"
export const PROPOSAL_KEY = "proposal."
export const PROPOSAL_VOTE_COUNT_KEY = "proposal_vote_count."
export const PROPOSAL_VOTE_KEY = "proposal_vote."
export const PROPOSAL_DEPOSIT_COUNT_KEY = "proposal_deposit_count."
export const PROPOSAL_DEPOSIT_KEY = "proposal_deposit."
export const PROPOSAL_ACTIVE_DEPOSIT_KEY = "proposal_active_deposit"
export const PROPOSAL_ACTIVE_VOTING_KEY = "proposal_active_voting"

export function getProposalVoteKey(proposal_id: u64, vote_id: u64): string {
    return PROPOSAL_VOTE_KEY + proposal_id.toString() + SPLIT + vote_id.toString()
}

export function getProposalDepositKey(proposal_id: u64, deposit_id: u64): string {
    return PROPOSAL_DEPOSIT_KEY + proposal_id.toString() + SPLIT + deposit_id.toString()
}

export function nextEndingDepositProposals(endDate: Date): Proposal[] {
    const proposalIds = getActiveDepositProposals()
    if (proposalIds.length == 0) return [];
    let i = 0;
    const proposals: Proposal[] = [];
    for (i = 0; i < proposalIds.length; i++) {
        const id = proposalIds[i]
        const proposal = getProposal(id)
        if (proposal == null) continue;
        if (proposal.deposit_end_time.getTime() <= endDate.getTime()) {
            proposals.push(proposal);
            continue
        };
        break;
    }
    proposalIds.splice(0, i);
    setActiveDepositProposals(proposalIds)
    return proposals
}

// we rely on the proposals to be ordered by voting_end_time
// TODO if voting period is changed, then this needs to be redone
export function nextEndingVotingProposals(endDate: Date): Proposal[] {
    const proposalIds = getActiveVotingProposals()
    if (proposalIds.length == 0) return [];
    let i = 0;
    const proposals: Proposal[] = [];
    for (i = 0; i < proposalIds.length; i++) {
        const id = proposalIds[i]
        const proposal = getProposal(id)
        if (proposal == null) continue;
        if (proposal.voting_end_time.getTime() <= endDate.getTime()) {
            proposals.push(proposal);
            continue
        };
        break;
    }
    proposalIds.splice(0, i);
    setActiveVotingProposals(proposalIds)
    return proposals
}

export function getActiveDepositProposals(): u64[] {
    const value = wasmxw.sload(PROPOSAL_ACTIVE_DEPOSIT_KEY)
    if (value === "") return [];
    return JSON.parse<u64[]>(value);
}

export function addActiveDepositProposal(proposal_id: u64): void {
    const ids = getActiveDepositProposals()
    ids.push(proposal_id)
    setActiveDepositProposals(ids)
}

export function removeActiveDepositProposal(proposal_id: u64): void {
    const ids = getActiveDepositProposals()
    for (let i = 0; i < ids.length; i++) {
        if (ids[i] == proposal_id) {
            ids.splice(i, 1)
            break;
        }
    }
    setActiveDepositProposals(ids)
}

export function setActiveDepositProposals(proposalIds: u64[]): void {
    wasmxw.sstore(PROPOSAL_ACTIVE_DEPOSIT_KEY, JSON.stringify<u64[]>(proposalIds))
}

export function getActiveVotingProposals(): u64[] {
    const value = wasmxw.sload(PROPOSAL_ACTIVE_VOTING_KEY)
    if (value === "") return [];
    return JSON.parse<u64[]>(value);
}

export function addActiveVotingProposal(proposal: u64): void {
    const ids = getActiveVotingProposals()
    ids.push(proposal)
    setActiveVotingProposals(ids)
}

export function removeActiveVotingProposal(proposal_id: u64): void {
    const ids = getActiveVotingProposals()
    for (let i = 0; i < ids.length; i++) {
        if (ids[i] == proposal_id) {
            ids.splice(i, 1)
            break;
        }
    }
    setActiveVotingProposals(ids)
}

export function setActiveVotingProposals(proposals: u64[]): void {
    wasmxw.sstore(PROPOSAL_ACTIVE_VOTING_KEY, JSON.stringify<u64[]>(proposals))
}

// proposal_id => deposit_id => deposit GET
export function getProposalDeposit(proposal_id: u64, vote_id: u64): Deposit | null {
    const value = wasmxw.sload(getProposalDepositKey(proposal_id, vote_id));
    if (value === "") return null;
    return JSON.parse<Deposit>(value);
}

// proposal_id => deposit_id => deposit SET
export function setProposalDeposit(proposal_id: u64, deposit_id: u64, value: Deposit): void {
    const data = JSON.stringify<Deposit>(value);
    wasmxw.sstore(getProposalDepositKey(proposal_id, deposit_id), data);
}

// proposal_id => deposit_id => deposit ADD
export function addProposalDeposit(proposal_id: u64, value: Deposit): u64 {
    const deposit_id = getProposalDepositCount(proposal_id)
    setProposalDeposit(proposal_id, deposit_id, value)
    return deposit_id;
}

// proposal_id => deposit_id => deposit : DELETE all deposits
export function removeProposalDeposits(proposal_id: u64): void {
    const deposit_id = getProposalDepositCount(proposal_id)
    for (let i = u64(0); i < deposit_id; i++) {
        wasmxw.sstore(getProposalDepositKey(proposal_id, deposit_id), "");
    }
    wasmxw.sstore(PROPOSAL_DEPOSIT_COUNT_KEY + proposal_id.toString(), "")
}

// proposal_id => deposit_counter GET
export function getProposalDepositCount(proposal_id: u64): u64 {
    const value = wasmxw.sload(PROPOSAL_DEPOSIT_COUNT_KEY + proposal_id.toString())
    if (value == "") return 0;
    return parseInt64(value);
}

// proposal_id => deposit_counter SET
export function setProposalDepositCount(proposal_id: u64, value: u64): void {
    wasmxw.sstore(PROPOSAL_DEPOSIT_COUNT_KEY + proposal_id.toString(), value.toString())
}

// proposal_id => vote_id => vote GET
export function getProposalVote(proposal_id: u64, vote_id: u64): Vote | null {
    const value = wasmxw.sload(getProposalVoteKey(proposal_id, vote_id));
    if (value === "") return null;
    return JSON.parse<Vote>(value);
}

// proposal_id => vote_id => vote SET
export function setProposalVote(proposal_id: u64, vote_id: u64, value: Vote): void {
    const data = JSON.stringify<Vote>(value);
    wasmxw.sstore(getProposalVoteKey(proposal_id, vote_id), data);
}

// proposal_id => vote_id => vote ADD
export function addProposalVote(proposal_id: u64, value: Vote): u64 {
    const vote_id = getProposalVoteCount(proposal_id)
    setProposalVote(proposal_id, vote_id, value)
    return vote_id
}

// proposal_id => vote_counter GET
export function getProposalVoteCount(proposal_id: u64): u64 {
    const value = wasmxw.sload(PROPOSAL_VOTE_COUNT_KEY + proposal_id.toString())
    if (value == "") return 0;
    return parseInt64(value);
}

// proposal_id => vote_counter SET
export function setProposalVoteCount(proposal_id: u64, value: u64): void {
    wasmxw.sstore(PROPOSAL_VOTE_COUNT_KEY + proposal_id.toString(), value.toString())
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

// proposal count GET
export function getProposalIdCount(): i64 {
    const value = wasmxw.sload(PROPOSAL_ID_COUNT_KEY)
    if (value == "") return 0;
    return parseInt64(value);
}

// proposal count SET
export function setProposalIdCount(value: i64): void {
    wasmxw.sstore(PROPOSAL_ID_COUNT_KEY, value.toString())
}

// proposal first id GET
export function getProposalIdFirst(): i64 {
    const value = wasmxw.sload(PROPOSAL_ID_FIRST_KEY)
    if (value == "") return 0;
    return parseInt64(value);
}

// proposal first id SET
export function setProposalIdFirst(value: i64): void {
    wasmxw.sstore(PROPOSAL_ID_FIRST_KEY, value.toString())
}

// proposal last id GET
export function getProposalIdLast(): i64 {
    const value = wasmxw.sload(PROPOSAL_ID_LAST_KEY)
    if (value == "") return 0;
    return parseInt64(value);
}

// proposal last id SET
export function setProposalIdLast(value: i64): void {
    wasmxw.sstore(PROPOSAL_ID_LAST_KEY, value.toString())
}

export function getParams(): Params {
    const value = wasmxw.sload(PARAM_KEY);
    return JSON.parse<Params>(value);
}

export function getParamsInternal(): string {
    return wasmxw.sload(PARAM_KEY);
}

export function setParams(params: Params): void {
    return wasmxw.sstore(PARAM_KEY, JSON.stringify<Params>(params));
}
