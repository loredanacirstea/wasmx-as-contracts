import { JSON } from "json-as";
import { Base64String, Bech32String, Coin } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn"
import { parseInt64 } from "wasmx-utils/assembly/utils";

export const MODULE_NAME = "gov"

export const MaxMetadataLen = 255

@json
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

@json
export class PageResponse {
    // next_key: Base64String
    total: u64
    constructor(total: u64) {
        // this.next_key = next_key
        this.total = total
    }
}

@json
export class Fraction {
    num: u64
    denom: u64
    constructor(num: u64, denom: u64) {
        this.num = num
        this.denom = denom
    }
}

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

export type VoteOptionString = string
export const OptionUnspecified = "VOTE_OPTION_UNSPECIFIED";
export const OptionYes = "VOTE_OPTION_YES";
export const OptionAbstain = "VOTE_OPTION_ABSTAIN";
export const OptionNo = "VOTE_OPTION_NO";
export const OptionNoVeto = "VOTE_OPTION_NO_WITH_VETO";

export const VoteOptionMap = new Map<string,i32>()
VoteOptionMap.set(OptionUnspecified, VOTE_OPTION_UNSPECIFIED)
VoteOptionMap.set(OptionYes, VOTE_OPTION_YES)
VoteOptionMap.set(OptionAbstain, VOTE_OPTION_ABSTAIN)
VoteOptionMap.set(OptionNo, VOTE_OPTION_NO)
VoteOptionMap.set(OptionNoVeto, VOTE_OPTION_NO_WITH_VETO)

// ProposalStatus enumerates the valid statuses of a proposal.
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

export const ProposalStatusUnspecified = "PROPOSAL_STATUS_UNSPECIFIED";
export const ProposalStatusDepositPeriod = "PROPOSAL_STATUS_DEPOSIT_PERIOD";
export const ProposalStatusVotingPeriod = "PROPOSAL_STATUS_VOTING_PERIOD";
export const ProposalStatusPassed = "PROPOSAL_STATUS_PASSED";
export const ProposalStatusRejected = "PROPOSAL_STATUS_REJECTED";
export const ProposalStatusFailed = "PROPOSAL_STATUS_FAILED";

export const ProposalStatusMap = new Map<string,i32>()
ProposalStatusMap.set(ProposalStatusUnspecified, PROPOSAL_STATUS_UNSPECIFIED)
ProposalStatusMap.set(ProposalStatusDepositPeriod, PROPOSAL_STATUS_DEPOSIT_PERIOD)
ProposalStatusMap.set(ProposalStatusVotingPeriod, PROPOSAL_STATUS_VOTING_PERIOD)
ProposalStatusMap.set(ProposalStatusPassed, PROPOSAL_STATUS_PASSED)
ProposalStatusMap.set(ProposalStatusRejected, PROPOSAL_STATUS_REJECTED)
ProposalStatusMap.set(ProposalStatusFailed, PROPOSAL_STATUS_FAILED)

@json
export class WeightedVoteOption {
    option: VoteOption
    weight: string
    constructor(option: VoteOption, weight: string) {
        this.option = option
        this.weight = weight
    }
}

@json
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

@json
export class Proposal {
    id: u64
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

    getDepositDenom(): string {
        return this.total_deposit[0].denom
    }

    getDeposit(): Coin {
        return this.total_deposit[0]
    }
    getDepositAmount(): BigInt {
        return this.total_deposit[0].amount
    }
}

@json
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

@json
export class TextProposal {
    title: string
    description: string
    constructor(title: string, description: string) {
        this.title = title
        this.description = description
    }
}

@json
export class DepositParams { // deprecated
    min_deposit: Coin[]
    max_deposit_period: i64
    constructor(min_deposit: Coin[], max_deposit_period: i64) {
        this.min_deposit = min_deposit
        this.max_deposit_period = max_deposit_period
    }
}

@json
export class VotingParams { // deprecated
    voting_period: i64
    constructor(voting_period: i64) {
        this.voting_period = voting_period
    }
}

@json
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
@json
export class Params {
    // Minimum deposit for a proposal to enter voting period.
    min_deposit: Coin[]
    // Maximum period for Atom holders to deposit on a proposal. Initial value: 2 months.
    max_deposit_period: i64 // time.Duration in milliseconds
    // Duration of the voting period.
    voting_period: i64 // time.Duration in milliseconds
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
    expedited_voting_period: i64 // time.Duration in milliseconds

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
        min_deposit: Coin[],
        max_deposit_period: i64,
        voting_period: i64,
        quorum: string,
        threshold: string,
        veto_threshold: string,
        min_initial_deposit_ratio: string,
        proposal_cancel_ratio: string,
        proposal_cancel_dest: Bech32String,
        expedited_voting_period: i64,
        expedited_threshold: string,
        expedited_min_deposit: Coin[],
        burn_vote_quorum: bool,
        burn_proposal_deposit_prevote: bool,
        burn_vote_veto: bool,
        min_deposit_ratio: string // f64,
    ) {
        this.min_deposit = min_deposit
        this.max_deposit_period = max_deposit_period
        this.voting_period = voting_period
        this.quorum = quorum
        this.threshold = threshold
        this.veto_threshold = veto_threshold
        this.min_initial_deposit_ratio = min_initial_deposit_ratio
        this.proposal_cancel_ratio = proposal_cancel_ratio
        this.proposal_cancel_dest = proposal_cancel_dest
        this.expedited_voting_period = expedited_voting_period
        this.expedited_threshold = expedited_threshold
        this.expedited_min_deposit = expedited_min_deposit
        this.burn_vote_quorum = burn_vote_quorum
        this.burn_proposal_deposit_prevote = burn_proposal_deposit_prevote
        this.burn_vote_veto = burn_vote_veto
        this.min_deposit_ratio = min_deposit_ratio
    }

    getMinDepositDenom(): string {
        return this.min_deposit[0].denom
    }

    getMinDeposit(): Coin {
        return this.min_deposit[0]
    }
    getMinDepositAmount(): BigInt {
        return this.min_deposit[0].amount
    }
}

@json
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

@json
export class GenesisStateExternal {
    starting_proposal_id: string
    deposits: Deposit[]
    votes: Vote[]
    proposals: Proposal[]
    params: Params
    constitution: string
    constructor(starting_proposal_id: string, deposits: Deposit[], votes: Vote[], proposals: Proposal[], params: Params, constitution: string) {
        this.starting_proposal_id = starting_proposal_id
        this.deposits = deposits
        this.votes = votes
        this.proposals = proposals
        this.params = params
        this.constitution = constitution
    }
}

@json
export class GenesisState {
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

    @serializer
    serializer(self: GenesisState): string {
        return JSON.stringify<GenesisStateExternal>(new GenesisStateExternal(self.starting_proposal_id.toString(), self.deposits, self.votes, self.proposals, self.params, self.constitution))
    }

    @deserializer
    deserializer(data: string): GenesisState {
        const v = JSON.parse<GenesisStateExternal>(data)
        const id = u64(parseInt64(v.starting_proposal_id))
        return new GenesisState(id, v.deposits, v.votes, v.proposals, v.params, v.constitution)
    }
}

@json
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

@json
export class MsgSubmitProposalResponse {
    proposal_id: u64
    constructor(proposal_id: u64) {
        this.proposal_id = proposal_id
    }
}

// MsgExecLegacyContent is used to wrap the legacy content field into a message.
@json
export class MsgExecLegacyContent {
    content: Base64String
    authority: string // gov
    constructor(content: Base64String, authority: string) {
        this.content = content
        this.authority = authority
    }
}

@json
export class MsgExecLegacyContentResponse {}

@json
export class MsgVote {
    proposal_id: u64
    voter: Bech32String
    option: VoteOptionString
    // metadata is any arbitrary metadata attached to the Vote.
    metadata: string
    constructor(proposal_id: u64, voter: Bech32String, option: VoteOptionString, metadata: string) {
        this.proposal_id = proposal_id
        this.voter = voter
        this.option = option
        this.metadata = metadata
    }
}

@json
export class MsgVoteResponse {}

@json
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

@json
export class MsgVoteWeightedResponse {}

@json
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

@json
export class MsgDepositResponse {}

@json
export class MsgUpdateParams {
    authority: string
    params: Params
    constructor(authority: string, params: Params) {
        this.authority = authority
        this.params = params
    }
}

@json
export class MsgUpdateParamsResponse {}

@json
export class MsgCancelProposal {
    proposal_id: u64
    proposer: Bech32String
    constructor(proposal_id: u64, proposer: Bech32String) {
        this.proposal_id = proposal_id
        this.proposer = proposer
    }
}

@json
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

@json
export class QueryProposalRequest {
    proposal_id: u64
    constructor(proposal_id: u64) {
        this.proposal_id = proposal_id
    }
}

@json
export class QueryProposalResponse {
    proposal: Proposal
    constructor(proposal: Proposal) {
        this.proposal = proposal
    }
}

@json
export class QueryProposalsRequest {
    proposal_status: string
    voter: Bech32String
    depositor: Bech32String
    pagination: PageRequest
    constructor(proposal_status: string, voter: Bech32String, depositor: Bech32String, pagination: PageRequest) {
        this.proposal_status = proposal_status
        this.voter = voter
        this.depositor = depositor
        this.pagination = pagination
    }
}

@json
export class QueryProposalsResponse {
    proposals: Proposal[]
    pagination: PageResponse
    constructor(proposals: Proposal[], pagination: PageResponse) {
        this.proposals = proposals
        this.pagination = pagination
    }
}

@json
export class QueryVoteRequest {
    proposal_id: u64
    voter: Bech32String
    constructor(proposal_id: u64, voter: Bech32String) {
        this.proposal_id = proposal_id
        this.voter = voter
    }
}

@json
export class QueryVoteResponse {
    vote: Vote
    constructor(vote: Vote) {
        this.vote = vote
    }
}

@json
export class QueryVotesRequest {
    proposal_id: u64
    pagination: PageRequest
    constructor(proposal_id: u64, pagination: PageRequest) {
        this.proposal_id = proposal_id
        this.pagination = pagination
    }
}

@json
export class QueryVotesResponse {
    votes: Vote[]
    pagination: PageResponse
    constructor(votes: Vote[], pagination: PageResponse) {
        this.votes = votes
        this.pagination = pagination
    }
}

@json
export class QueryParamsRequest {
    params_type: string
    constructor(params_type: string) {
        this.params_type = params_type
    }
}

@json
export class QueryParamsResponse {
    params: Params
    constructor(params: Params) {
        this.params = params
    }
}

@json
export class QueryDepositRequest {
    proposal_id: u64
    depositor: Bech32String
    constructor(proposal_id: u64, depositor: Bech32String) {
        this.proposal_id = proposal_id
        this.depositor = depositor
    }
}

@json
export class QueryDepositResponse {
    deposit: Deposit
    constructor(deposit: Deposit) {
        this.deposit = deposit
    }
}

@json
export class QueryDepositsRequest {
    proposal_id: u64
    pagination: PageRequest
    constructor(proposal_id: u64, pagination: PageRequest) {
        this.proposal_id = proposal_id
        this.pagination = pagination
    }
}

@json
export class QueryDepositsResponse {
    deposits: Deposit[]
    pagination: PageResponse
    constructor(deposits: Deposit[], pagination: PageResponse) {
        this.deposits = deposits
        this.pagination = pagination
    }
}

@json
export class QueryTallyResultRequest {
    proposal_id: u64
    constructor(proposal_id: u64) {
        this.proposal_id = proposal_id
    }
}

@json
export class QueryTallyResultResponse {
    tally: TallyResult
    constructor(tally: TallyResult) {
        this.tally = tally
    }
}

@json
export class MsgEndBlock {
    data: Base64String
    constructor(data: Base64String) {
        this.data = data
    }
}

@json
export class Response {
    success: bool
    data: string
    constructor(success: bool, data: string) {
        this.success = success
        this.data = data
    }
}

@json
export class MsgInitialize {
	bond_base_denom: string = ""
    constructor(bond_base_denom: string) {
        this.bond_base_denom = bond_base_denom
    }
}
