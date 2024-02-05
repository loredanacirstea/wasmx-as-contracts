import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, Coin, HexString } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn"

export const MODULE_NAME = "gov"

// @ts-ignore
@serializable
export class PageRequest {
    key: u8
    offset: u64
    limit: u64
    count_total: bool
    reverse: bool
    constructor( key: u8, offset: u64, limit: u64, count_total: bool, reverse: bool) {
        this.key = key
        this.offset = offset
        this.limit = limit
        this.count_total = count_total
        this.reverse = reverse
    }
}

// @ts-ignore
@serializable
export class PageResponse {
    // next_key: Base64String
    total: u64
    constructor(total: u64) {
        // this.next_key = next_key
        this.total = total
    }
}

// @ts-ignore
@serializable
export type VoteOption = i32
// VOTE_OPTION_UNSPECIFIED defines a no-op vote option.
export const VOTE_OPTION_UNSPECIFIED = 0;
// VOTE_OPTION_YES defines a yes vote option.
export const VOTE_OPTION_YES = 1;
// VOTE_OPTION_ABSTAIN defines an abstain vote option.
export const VOTE_OPTION_ABSTAIN = 2;
// VOTE_OPTION_NO defines a no vote option.
export const VOTE_OPTION_NO = 3;
// VOTE_OPTION_NO_WITH_VETO defines a no with veto vote option.
export const VOTE_OPTION_NO_WITH_VETO = 4;

// @ts-ignore
@serializable
export type VoteOptionString = string
export const OptionUnspecified = "VOTE_OPTION_UNSPECIFIED";
export const OptionYes = "VOTE_OPTION_YES";
export const OptionAbstain = "VOTE_OPTION_ABSTAIN";
export const OptionNo = "VOTE_OPTION_NO";
export const OptionNoVeto = "VOTE_OPTION_NO_WITH_VETO";

// ProposalStatus enumerates the valid statuses of a proposal.
// @ts-ignore
@serializable
export type ProposalStatus = i32
// PROPOSAL_STATUS_UNSPECIFIED defines the default proposal status.
export const PROPOSAL_STATUS_UNSPECIFIED = 0 // StatusNil
// PROPOSAL_STATUS_DEPOSIT_PERIOD defines a proposal status during the deposit
// period.
export const PROPOSAL_STATUS_DEPOSIT_PERIOD = 1 // StatusDepositPeriod
// PROPOSAL_STATUS_VOTING_PERIOD defines a proposal status during the voting
// period.
export const PROPOSAL_STATUS_VOTING_PERIOD = 2 // StatusVotingPeriod
// PROPOSAL_STATUS_PASSED defines a proposal status of a proposal that has
// passed.
export const PROPOSAL_STATUS_PASSED = 3 // StatusPassed
// PROPOSAL_STATUS_REJECTED defines a proposal status of a proposal that has
// been rejected.
export const PROPOSAL_STATUS_REJECTED = 4 // StatusRejected
// PROPOSAL_STATUS_FAILED defines a proposal status of a proposal that has
// failed.
export const PROPOSAL_STATUS_FAILED = 5 // StatusFailed

// @ts-ignore
@serializable
export class WeightedVoteOption {
    option: VoteOption
    weight: string
    constructor(option: VoteOption, weight: string) {
        this.option = option
        this.weight = weight
    }
}

// @ts-ignore
@serializable
export class Vote {
    proposal_id: u64
    voter: Bech32String
    // Deprecated: Prefer to use `options` instead. This field is set in queries
    // if and only if `len(options) == 1` and that option has weight 1. In all
    // other cases, this field will default to VOTE_OPTION_UNSPECIFIED.
    option: VoteOption // deprecated
    options: WeightedVoteOption[]
    constructor(proposal_id: u64, voter: Bech32String, option: VoteOption, options: WeightedVoteOption[]) {
        this.proposal_id = proposal_id
        this.voter = voter
        this.option = option
        this.options = options
    }
}

// @ts-ignore
@serializable
export class Proposal {
    proposal_id: u64
    content: Base64String
    status: ProposalStatus
    final_tally_result: TallyResult
    submit_time: Date
    deposit_end_time: Date
    total_deposit: Coin[]
    voting_start_time: Date
    voting_end_time: Date
    constructor(proposal_id: u64, content: Base64String, status: ProposalStatus, final_tally_result: TallyResult, submit_time: Date, deposit_end_time: Date, total_deposit: Coin[], voting_start_time: Date, voting_end_time: Date) {
        this.proposal_id = proposal_id
        this.content = content
        this.status = status
        this.final_tally_result = final_tally_result
        this.submit_time = submit_time
        this.deposit_end_time = deposit_end_time
        this.total_deposit = total_deposit
        this.voting_start_time = voting_start_time
        this.voting_end_time = voting_end_time
    }
}

// @ts-ignore
@serializable
export class TallyResult {
    yes: BigInt
    abstain: BigInt
    no: BigInt
    no_with_veto: BigInt
    constructor(yes: BigInt, abstain: BigInt, no: BigInt, no_with_veto: BigInt) {
        this.yes = yes
        this.abstain = abstain
        this.no = no
        this.no_with_veto = no_with_veto
    }
}

// @ts-ignore
@serializable
export class TextProposal {
    title: string
    description: string
    constructor(title: string, description: string) {
        this.title = title
        this.description = description
    }
}

// @ts-ignore
@serializable
export class DepositParams {
    min_deposit: Coin[]
    max_deposit_period: i64
    constructor(min_deposit: Coin[], max_deposit_period: i64) {
        this.min_deposit = min_deposit
        this.max_deposit_period = max_deposit_period
    }
}

// @ts-ignore
@serializable
export class VotingParams {
    voting_period: i64
    constructor(voting_period: i64) {
        this.voting_period = voting_period
    }
}

// @ts-ignore
@serializable
export class TallyParams {
    quorum: Base64String
    threshold: Base64String
    veto_threshold: Base64String
    constructor(quorum: Base64String, threshold: Base64String, veto_threshold: Base64String) {
        this.quorum = quorum
        this.threshold = threshold
        this.veto_threshold = veto_threshold
    }
}

// @ts-ignore
@serializable
export class Deposit {
    proposal_id: u64
    depositor: Bech32String
    amount: Coin[]
    constructor(proposal_id: u64, depositor: Bech32String, amount: Coin[]) {
        this.proposal_id = proposal_id
        this.depositor = depositor
        this.amount = amount
    }
}

// @ts-ignore
@serializable
export class MsgInitGenesis {
    starting_proposal_id: u64
    deposits: Deposit[]
    votes: Vote[]
    proposals: Proposal[]
    deposit_params: DepositParams
    voting_params: VotingParams
    tally_params: TallyParams
    constructor(starting_proposal_id: u64, deposits: Deposit[], votes: Vote[], proposals: Proposal[], deposit_params: DepositParams, voting_params: VotingParams, tally_params: TallyParams) {
        this.starting_proposal_id = starting_proposal_id
        this.deposits = deposits
        this.votes = votes
        this.proposals = proposals
        this.deposit_params = deposit_params
        this.voting_params = voting_params
        this.tally_params = tally_params
    }
}

// @ts-ignore
@serializable
export class MsgSubmitProposal {
    content: Base64String
    initial_deposit: Coin[]
    proposer: Bech32String
    constructor(content: Base64String, initial_deposit: Coin[], proposer: Bech32String) {
        this.content = content
        this.initial_deposit = initial_deposit
        this.proposer = proposer
    }
}

// @ts-ignore
@serializable
export class MsgSubmitProposalResponse {
    proposal_id: u64
    constructor(proposal_id: u64) {
        this.proposal_id = proposal_id
    }
}

// @ts-ignore
@serializable
export class MsgVote {
    proposal_id: u64
    voter: Bech32String
    option: VoteOption
    constructor(proposal_id: u64, voter: Bech32String, option: VoteOption) {
        this.proposal_id = proposal_id
        this.voter = voter
        this.option = option
    }
}

// @ts-ignore
@serializable
export class MsgVoteResponse {}

// @ts-ignore
@serializable
export class MsgVoteWeighted {
    proposal_id: u64
    voter: Bech32String
    option: WeightedVoteOption
    constructor(proposal_id: u64, voter: Bech32String, option: WeightedVoteOption) {
        this.proposal_id = proposal_id
        this.voter = voter
        this.option = option
    }
}

// @ts-ignore
@serializable
export class MsgVoteWeightedResponse {}

// @ts-ignore
@serializable
export class MsgDeposit {
    proposal_id: u64
    depositor: Bech32String
    amount: Coin[]
    constructor(proposal_id: u64, depositor: Bech32String, amount: Coin[]) {
        this.proposal_id = proposal_id
        this.depositor = depositor
        this.amount = amount
    }
}

// @ts-ignore
@serializable
export class MsgDepositResponse {}

// @ts-ignore
@serializable
export class QueryProposalRequest {
    proposal_id: u64
    constructor(proposal_id: u64) {
        this.proposal_id = proposal_id
    }
}

// @ts-ignore
@serializable
export class QueryProposalResponse {
    proposal: Proposal
    constructor(proposal: Proposal) {
        this.proposal = proposal
    }
}

// @ts-ignore
@serializable
export class QueryProposalsRequest {
    proposal_status: ProposalStatus
    voter: Bech32String
    depositor: Bech32String
    pagination: PageRequest
    constructor(proposal_status: ProposalStatus, voter: Bech32String, depositor: Bech32String, pagination: PageRequest) {
        this.proposal_status = proposal_status
        this.voter = voter
        this.depositor = depositor
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QueryProposalsResponse {
    proposals: Proposal[]
    pagination: PageRequest
    constructor(proposals: Proposal[], pagination: PageRequest) {
        this.proposals = proposals
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QueryVoteRequest {
    proposal_id: u64
    voter: Bech32String
    constructor(proposal_id: u64, voter: Bech32String) {
        this.proposal_id = proposal_id
        this.voter = voter
    }
}

// @ts-ignore
@serializable
export class QueryVoteResponse {
    vote: Vote
    constructor(vote: Vote) {
        this.vote = vote
    }
}

// @ts-ignore
@serializable
export class QueryVotesRequest {
    proposal_id: u64
    pagination: PageRequest
    constructor(proposal_id: u64, pagination: PageRequest) {
        this.proposal_id = proposal_id
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QueryVotesResponse {
    votes: Vote[]
    pagination: PageResponse
    constructor(votes: Vote[], pagination: PageResponse) {
        this.votes = votes
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QueryParamsRequest {
    params_type: string
    constructor(params_type: string) {
        this.params_type = params_type
    }
}

// @ts-ignore
@serializable
export class QueryParamsResponse {
    voting_params: VotingParams
    deposit_params: DepositParams
    tally_params: TallyParams
    constructor(voting_params: VotingParams, deposit_params: DepositParams, tally_params: TallyParams) {
        this.voting_params = voting_params
        this.deposit_params = deposit_params
        this.tally_params = tally_params
    }
}

// @ts-ignore
@serializable
export class QueryDepositRequest {
    proposal_id: u64
    depositor: Bech32String
    constructor(proposal_id: u64, depositor: Bech32String) {
        this.proposal_id = proposal_id
        this.depositor = depositor
    }
}

// @ts-ignore
@serializable
export class QueryDepositResponse {
    deposit: Deposit
    constructor(deposit: Deposit) {
        this.deposit = deposit
    }
}

// @ts-ignore
@serializable
export class QueryDepositsRequest {
    proposal_id: u64
    pagination: PageRequest
    constructor(proposal_id: u64, pagination: PageRequest) {
        this.proposal_id = proposal_id
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QueryDepositsResponse {
    deposits: Deposit[]
    pagination: PageResponse
    constructor(deposits: Deposit[], pagination: PageResponse) {
        this.deposits = deposits
        this.pagination = pagination
    }
}

// @ts-ignore
@serializable
export class QueryTallyResultRequest {
    proposal_id: u64
    constructor(proposal_id: u64) {
        this.proposal_id = proposal_id
    }
}

// @ts-ignore
@serializable
export class QueryTallyResultResponse {
    tally: TallyResult
    constructor(tally: TallyResult) {
        this.tally = tally
    }
}
