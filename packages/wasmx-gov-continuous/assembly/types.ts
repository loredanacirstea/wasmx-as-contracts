import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, Coin } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn"
import * as gov from "wasmx-gov/assembly/types"

export const MODULE_NAME = "gov-continuous"
export const VERSION = "0.0.1"

export enum Coefs {
    precision,
    cAL,
    maxWinnerCoef,
    maxWinnerToggle,
    maxWinnerToggleArbiter,
    optionRegisterAmount,
    proposalRatioX,
    proposalRatioY
}

// @ts-ignore
@serializable
export class Proposal {
    id: u64
    // TODO have multiple messages in a Proposal
    // messages: Base64String[]
    status: gov.ProposalStatus
    // final_tally_result: TallyResult
    submit_time: Date
    deposit_end_time: Date
    // total_deposit: Coin[]
    voting_start_time: Date
    voting_end_time: Date
    // metadata is any arbitrary metadata attached to the proposal.
    // the recommended format of the metadata is to be found here:
    // https://docs.cosmos.network/v0.47/modules/gov#proposal-3
    metadata: string // URL | IPFS CID etc
    // title is the title of the proposal
    // Since: cosmos-sdk 0.47
    title: string
    // summary is a short summary of the proposal
    // Since: cosmos-sdk 0.47
    summary: string
    // proposer is the address of the proposal sumbitter
    // Since: cosmos-sdk 0.47
    proposer: Bech32String
    // expedited defines if the proposal is expedited
    // Since: cosmos-sdk 0.50
    // expedited: bool;
    // failed_reason defines the reason why the proposal failed
    // Since: cosmos-sdk 0.50
    failed_reason: string
    // continuous voting

    x: u64
    y: u64
    denom: string
    options: ProposalOption[]
    vote_status: ProposalVoteStatus
    // current winner - may be different from current vote_status
    winner: i32

    constructor(
        id: u64,
        // messages: Base64String[],
        status: gov.ProposalStatus,
        // final_tally_result: TallyResult,
        submit_time: Date, deposit_end_time: Date,
        // total_deposit: Coin[],
        voting_start_time: Date, voting_end_time: Date,
        metadata: string, title: string, summary: string, proposer: Bech32String,
        // expedited: bool,
        failed_reason: string,
        x: u64, y: u64,
        denom: string,
        options: ProposalOption[],
        vote_status: ProposalVoteStatus,
        winner: i32,
    ) {
        this.id = id
        // this.messages = messages
        this.status = status
        // this.final_tally_result = final_tally_result
        this.submit_time = submit_time
        this.deposit_end_time = deposit_end_time
        // this.total_deposit = total_deposit
        this.voting_start_time = voting_start_time
        this.voting_end_time = voting_end_time
        this.metadata = metadata
        this.title = title
        this.summary = summary
        this.proposer = proposer
        // this.expedited = expedited
        this.failed_reason = failed_reason

        this.x = x
        this.y = y
        this.denom = denom
        this.options = options
        this.vote_status = vote_status
        this.winner = winner
    }
}

// @ts-ignore
@serializable
export class ProposalOption {
    proposer: Bech32String
    messages: Base64String[]
    amount: BigInt
    arbitrationAmount: BigInt
    title: string
    summary: string
    metadata: string
    constructor(proposer: Bech32String, messages: Base64String[], amount: BigInt, arbitrationAmount: BigInt, title: string, summary: string, metadata: string) {
        this.proposer = proposer
        this.messages = messages
        this.amount = amount
        this.arbitrationAmount = arbitrationAmount
        this.title = title
        this.summary = summary
        this.metadata = metadata
    }
}

export type VoteStatus = i32
export const VOTE_STATUS_UNSPECIFIED: VoteStatus = 0;
export const VOTE_STATUS_X: VoteStatus = 1; // x won
export const VOTE_STATUS_Y: VoteStatus = 2; // y won
export const VOTE_STATUS_Xu: VoteStatus = 3; // x undecided
export const VOTE_STATUS_Yu: VoteStatus = 4; // y undecided

// @ts-ignore
@serializable
export class ProposalVoteStatus {
    // vote status based on xi, yi
    status: VoteStatus
    // the option index with the highest weight at current time
    xi: i32
    // the option index with the second highest weight
    yi: i32
    // last change triggered option execution
    changed: bool
    constructor(status: VoteStatus, xi: i32, yi: i32, changed: bool) {
        this.status = status
        this.xi = xi
        this.yi = yi
        this.changed = changed
    }
}

// @ts-ignore
@serializable
export class ProposalVoteStatusExtended {
    status: VoteStatus
    // the option index with the highest weight at current time
    xi: i32
    // the option index with the second highest weight
    yi: i32
    // the highest amount
    x: BigInt
    // the second highest amount
    y: BigInt
    constructor(status: VoteStatus, xi: i32, yi: i32, x: BigInt, y: BigInt) {
        this.status = status
        this.xi = xi
        this.yi = yi
        this.x = x
        this.y = y
    }
}

// @ts-ignore
@serializable
export class CoefProposal {
    key: BigInt
    value: BigInt
    constructor(key: BigInt, value: BigInt) {
        this.key = key
        this.value = value
    }
}

// @ts-ignore
@serializable
export class MsgInitGenesis {
    starting_proposal_id: u64
    deposits: gov.Deposit[]
    votes: DepositVote[]
    proposals: Proposal[]
    params: gov.Params
    constitution: string
    constructor(starting_proposal_id: u64, deposits: gov.Deposit[], votes: DepositVote[], proposals: Proposal[], params: gov.Params, constitution: string) {
        this.starting_proposal_id = starting_proposal_id
        this.deposits = deposits
        this.votes = votes
        this.proposals = proposals
        this.params = params
        this.constitution = constitution
    }
}

// @ts-ignore
@serializable
export class Params {
    arbitrationDenom: string
    coefs: BigInt[]
    defaultX: u64
    defaultY: u64
    constructor(arbitrationDenom: string, coefs: BigInt[], defaultX: u64, defaultY: u64) {
        this.arbitrationDenom = arbitrationDenom
        this.coefs = coefs
        this.defaultX = defaultX
        this.defaultY = defaultY
    }
}

// @ts-ignore
@serializable
export class MsgSubmitProposalExtended {
// export class MsgSubmitProposalExtended extends gov.MsgSubmitProposal {
    // gov.MsgSubmitProposal
    messages: Base64String[]
    initial_deposit: Coin[]
    proposer: Bech32String
    metadata: string
    title: string
    summary: string
    expedited: bool

    // extra
    x: u64
    y: u64
    optionTitle: string
    optionSummary: string
    optionMetadata: string
    constructor(p: gov.MsgSubmitProposal, x: u64, y: u64, optionTitle: string, optionSummary: string, optionMetadata: string) {
        // super(p.messages, p.initial_deposit, p.proposer, p.metadata, p.title, p.summary, p.expedited);
        this.messages = p.messages
        this.initial_deposit = p.initial_deposit
        this.proposer = p.proposer
        this.metadata = p.metadata
        this.title = p.title
        this.summary = p.summary
        this.expedited = p.expedited

        this.x = x
        this.y = y
        this.optionTitle = optionTitle
        this.optionSummary = optionSummary
        this.optionMetadata = optionMetadata
    }
}

// @ts-ignore
@serializable
export class MsgAddProposalOption {
    proposal_id: i64
    option: ProposalOption
    constructor(proposal_id: i64, option: ProposalOption) {
        this.proposal_id = proposal_id
        this.option = option
    }
}

// @ts-ignore
@serializable
export class DepositVote {
    proposal_id: i64
    option_id: i32
    voter: Bech32String
    amount: BigInt
    arbitrationAmount: BigInt
    metadata: string
    constructor(proposal_id: i64, option_id: i32, voter: Bech32String, amount: BigInt, arbitrationAmount: BigInt, metadata: string) {
        this.proposal_id = proposal_id
        this.option_id = option_id
        this.voter = voter
        this.amount = amount
        this.arbitrationAmount = arbitrationAmount
        this.metadata = metadata
    }
}
