import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, Coin } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn"

export const MODULE_NAME = "gov"

export const MaxMetadataLen = 255

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
export class Fraction {
    num: u64
    denom: u64
    constructor(num: u64, denom: u64) {
        this.num = num
        this.denom = denom
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
    options: WeightedVoteOption[]
    // metadata is any arbitrary metadata attached to the vote.
    // the recommended format of the metadata is to be found here: https://docs.cosmos.network/v0.47/modules/gov#vote-5
    metadata: string
    constructor(proposal_id: u64, voter: Bech32String, options: WeightedVoteOption[], metadata: string) {
        this.proposal_id = proposal_id
        this.voter = voter
        this.options = options
        this.metadata = metadata
    }
}

// @ts-ignore
@serializable
export class Proposal {
    id: u64
    // TODO have multiple messages in a Proposal
    messages: Base64String[]
    status: ProposalStatus
    final_tally_result: TallyResult
    submit_time: Date
    deposit_end_time: Date
    total_deposit: Coin[]
    voting_start_time: Date
    voting_end_time: Date
    // metadata is any arbitrary metadata attached to the proposal.
    // the recommended format of the metadata is to be found here:
    // https://docs.cosmos.network/v0.47/modules/gov#proposal-3
    metadata: string
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
    expedited: bool;
    // failed_reason defines the reason why the proposal failed
    // Since: cosmos-sdk 0.50
    failed_reason: string
    constructor(
        id: u64,  messages: Base64String[], status: ProposalStatus,
        final_tally_result: TallyResult,
        submit_time: Date, deposit_end_time: Date,
        total_deposit: Coin[],
        voting_start_time: Date, voting_end_time: Date,
        metadata: string, title: string, summary: string, proposer: Bech32String,
        expedited: bool, failed_reason: string,
    ) {
        this.id = id
        this.messages = messages
        this.status = status
        this.final_tally_result = final_tally_result
        this.submit_time = submit_time
        this.deposit_end_time = deposit_end_time
        this.total_deposit = total_deposit
        this.voting_start_time = voting_start_time
        this.voting_end_time = voting_end_time
        this.metadata = metadata
        this.title = title
        this.summary = summary
        this.proposer = proposer
        this.expedited = expedited
        this.failed_reason = failed_reason
    }
}

// @ts-ignore
@serializable
export class TallyResult {
    // yes_count is the number of yes votes on a proposal.
    yes_count: BigInt
    // abstain_count is the number of abstain votes on a proposal.
    abstain_count: BigInt
    // no_count is the number of no votes on a proposal.
    no_count: BigInt
    // no_with_veto_count is the number of no with veto votes on a proposal.
    no_with_veto_count: BigInt
    constructor(yes_count: BigInt, abstain_count: BigInt, no_count: BigInt, no_with_veto_count: BigInt) {
        this.yes_count = yes_count
        this.abstain_count = abstain_count
        this.no_count = no_count
        this.no_with_veto_count = no_with_veto_count
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
export class DepositParams { // deprecated
    min_deposit: Coin[]
    max_deposit_period: i64
    constructor(min_deposit: Coin[], max_deposit_period: i64) {
        this.min_deposit = min_deposit
        this.max_deposit_period = max_deposit_period
    }
}

// @ts-ignore
@serializable
export class VotingParams { // deprecated
    voting_period: i64
    constructor(voting_period: i64) {
        this.voting_period = voting_period
    }
}

// @ts-ignore
@serializable
export class TallyParams { // deprecated
    // Minimum percentage of total stake needed to vote for a result to
    // be considered valid.
    quorum: string // f64
    // Minimum proportion of Yes votes for proposal to pass. Default value: 0.5.
    threshold: string // f64
    // Minimum value of Veto votes to Total votes ratio for proposal to be
    // vetoed. Default value: 1/3.
    veto_threshold: string // f64
    constructor(quorum: string, threshold: string, veto_threshold: string) {
        this.quorum = quorum
        this.threshold = threshold
        this.veto_threshold = veto_threshold
    }
}

// Params defines the parameters for the x/gov module.
// Since: cosmos-sdk 0.47
// @ts-ignore
@serializable
export class Params {
    // Minimum deposit for a proposal to enter voting period.
    min_deposit: Coin[]
    // Maximum period for Atom holders to deposit on a proposal. Initial value: 2 months.
    max_deposit_period_ms: i64 // time.Duration in milliseconds
    // Duration of the voting period.
    voting_period_ms: i64 // time.Duration in milliseconds
    //  Minimum percentage of total stake needed to vote for a result to be considered valid.
    quorum: string // f64
    //  Minimum proportion of Yes votes for proposal to pass. Default value: 0.5.
    threshold: string // f64
    //  Minimum value of Veto votes to Total votes ratio for proposal to be
    //  vetoed. Default value: 1/3.
    veto_threshold: string // f64
    //  The ratio representing the proportion of the deposit value that must be paid at proposal submission.
    min_initial_deposit_ratio: string // f64
    // The cancel ratio which will not be returned back to the depositors when a proposal is cancelled.
    // Since: cosmos-sdk 0.50
    proposal_cancel_ratio: string // f64

    // The address which will receive (proposal_cancel_ratio * deposit) proposal deposits.
    // If empty, the (proposal_cancel_ratio * deposit) proposal deposits will be burned.
    // Since: cosmos-sdk 0.50
    proposal_cancel_dest: Bech32String

    // Duration of the voting period of an expedited proposal.
    // Since: cosmos-sdk 0.50
    expedited_voting_period_ms: i64 // time.Duration in milliseconds

    // Minimum proportion of Yes votes for proposal to pass. Default value: 0.67.
    // Since: cosmos-sdk 0.50
    expedited_threshold: string // f64
    //  Minimum expedited deposit for a proposal to enter voting period.
    expedited_min_deposit: Coin[]
    // burn deposits if a proposal does not meet quorum
    burn_vote_quorum: bool
    // burn deposits if the proposal does not enter voting period
    burn_proposal_deposit_prevote: bool
    // burn deposits if quorum with vote type no_veto is met
    burn_vote_veto: bool
    // The ratio representing the proportion of the deposit value minimum that must be met when making a deposit.
    // Default value: 0.01. Meaning that for a chain with a min_deposit of 100stake, a deposit of 1stake would be
    // required.
    // Since: cosmos-sdk 0.50
    min_deposit_ratio: string // f64
    constructor(
        min_deposit: Coin[], max_deposit_period_ms: i64, voting_period_ms: i64, quorum: string, threshold: string, veto_threshold: string,
        min_initial_deposit_ratio: string,
        proposal_cancel_ratio: string,
        proposal_cancel_dest: Bech32String,
        expedited_voting_period_ms: i64,
        expedited_threshold: string,
        expedited_min_deposit: Coin[],
        burn_vote_quorum: bool,
        burn_proposal_deposit_prevote: bool,
        burn_vote_veto: bool,
        min_deposit_ratio: string // f64,
    ) {
        this.min_deposit = min_deposit
        this.max_deposit_period_ms = max_deposit_period_ms
        this.voting_period_ms = voting_period_ms
        this.quorum = quorum
        this.threshold = threshold
        this.veto_threshold = veto_threshold
        this.min_initial_deposit_ratio = min_initial_deposit_ratio
        this.proposal_cancel_ratio = proposal_cancel_ratio
        this.proposal_cancel_dest = proposal_cancel_dest
        this.expedited_voting_period_ms = expedited_voting_period_ms
        this.expedited_threshold = expedited_threshold
        this.expedited_min_deposit = expedited_min_deposit
        this.burn_vote_quorum = burn_vote_quorum
        this.burn_proposal_deposit_prevote = burn_proposal_deposit_prevote
        this.burn_vote_veto = burn_vote_veto
        this.min_deposit_ratio = min_deposit_ratio
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
    params: Params
    constitution: string
    constructor(starting_proposal_id: u64, deposits: Deposit[], votes: Vote[], proposals: Proposal[], params: Params, constitution: string) {
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
export class MsgSubmitProposal {
    messages: Base64String[]
    initial_deposit: Coin[]
    proposer: Bech32String
    metadata: string
    title: string
    summary: string
    expedited: bool
    constructor(messages: Base64String[], initial_deposit: Coin[], proposer: Bech32String, metadata: string, title: string, summary: string, expedited: bool) {
        this.messages = messages
        this.initial_deposit = initial_deposit
        this.proposer = proposer
        this.metadata = metadata
        this.title = title
        this.summary = summary
        this.expedited = expedited
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

// MsgExecLegacyContent is used to wrap the legacy content field into a message.
// @ts-ignore
@serializable
export class MsgExecLegacyContent {
    content: Base64String
    authority: string // gov
    constructor(content: Base64String, authority: string) {
        this.content = content
        this.authority = authority
    }
}

// @ts-ignore
@serializable
export class MsgExecLegacyContentResponse {}

// @ts-ignore
@serializable
export class MsgVote {
    proposal_id: u64
    voter: Bech32String
    option: VoteOption
    // metadata is any arbitrary metadata attached to the Vote.
    metadata: string
    constructor(proposal_id: u64, voter: Bech32String, option: VoteOption, metadata: string) {
        this.proposal_id = proposal_id
        this.voter = voter
        this.option = option
        this.metadata = metadata
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
    option: WeightedVoteOption[]
    metadata: string
    constructor(proposal_id: u64, voter: Bech32String, option: WeightedVoteOption[], metadata: string) {
        this.proposal_id = proposal_id
        this.voter = voter
        this.option = option
        this.metadata = metadata
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
export class MsgUpdateParams {
    authority: string
    params: Params
    constructor(authority: string, params: Params) {
        this.authority = authority
        this.params = params
    }
}

// @ts-ignore
@serializable
export class MsgUpdateParamsResponse {}

// @ts-ignore
@serializable
export class MsgCancelProposal {
    proposal_id: u64
    proposer: Bech32String
    constructor(proposal_id: u64, proposer: Bech32String) {
        this.proposal_id = proposal_id
        this.proposer = proposer
    }
}

// @ts-ignore
@serializable
export class MsgCancelProposalResponse {
    proposal_id: u64
    canceled_time: Date
    canceled_height: u64
    constructor(proposal_id: u64, canceled_time: Date, canceled_height: u64) {
        this.proposal_id = proposal_id
        this.canceled_time = canceled_time
        this.canceled_height = canceled_height
    }
}

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
    params: Params
    constructor(params: Params) {
        this.params = params
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

// @ts-ignore
@serializable
export class MsgEndBlock {
    data: Base64String
    constructor(data: Base64String) {
        this.data = data
    }
}

// @ts-ignore
@serializable
export class Response {
    success: bool
    data: string
    constructor(success: bool, data: string) {
        this.success = success
        this.data = data
    }
}
