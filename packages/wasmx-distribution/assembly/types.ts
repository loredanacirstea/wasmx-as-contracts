import { JSON } from "json-as";
import { Bech32String, Coin, DecCoin, PageRequest, PageResponse, ValidatorAddressString } from "wasmx-env/assembly/types";

export const MODULE_NAME = "distribution"

export const FEE_COLLECTOR_ROLE = "fee_collector"

@json
export class Params {
    community_tax: string // f64
    base_proposer_reward: string // f64
    bonus_proposer_reward: string // f64
    withdraw_addr_enabled: bool
    constructor(community_tax: string, base_proposer_reward: string, bonus_proposer_reward: string, withdraw_addr_enabled: bool) {
        this.community_tax = community_tax
        this.base_proposer_reward = base_proposer_reward
        this.bonus_proposer_reward = bonus_proposer_reward
        this.withdraw_addr_enabled = withdraw_addr_enabled
    }
}

@json
export class DelegatorWithdrawInfo {
    delegator_address: Bech32String
    withdraw_address: Bech32String
    constructor(delegator_address: Bech32String, withdraw_address: Bech32String) {
        this.delegator_address = delegator_address
        this.withdraw_address = withdraw_address
    }
}

@json
export class ValidatorOutstandingRewardsRecord {
    validator_address: ValidatorAddressString
    outstanding_rewards: DecCoin[]
    constructor(validator_address: Bech32String, outstanding_rewards: Coin[]) {
        this.validator_address = validator_address
        this.outstanding_rewards = outstanding_rewards
    }
}

@json
export class ValidatorAccumulatedCommission {
    commission: DecCoin[]
    constructor(commission: DecCoin[] ) {
        this.commission = commission
    }
}

@json
export class ValidatorAccumulatedCommissionRecord {
    validator_address: ValidatorAddressString
    accumulated: ValidatorAccumulatedCommission
    constructor(validator_address: Bech32String, accumulated: ValidatorAccumulatedCommission) {
        this.validator_address = validator_address
        this.accumulated = accumulated
    }
}

@json
export class ValidatorHistoricalRewards {
    cumulative_reward_ratio: DecCoin[]
    reference_count: u32
    constructor(cumulative_reward_ratio: DecCoin[], reference_count: u32) {
        this.cumulative_reward_ratio = cumulative_reward_ratio
        this.reference_count = reference_count
    }
}

@json
export class ValidatorCurrentRewards {
    rewards: DecCoin[]
    period: u64
    constructor(rewards: DecCoin[], period: u64) {
        this.rewards = rewards
        this.period = period
    }
}

@json
export class ValidatorHistoricalRewardsRecord {
    validator_address: ValidatorAddressString
    period: u64
    rewards: ValidatorHistoricalRewards
    constructor(validator_address: Bech32String, period: u64, rewards: ValidatorHistoricalRewards) {
        this.validator_address = validator_address
        this.period = period
        this.rewards = rewards
    }
}

@json
export class ValidatorCurrentRewardsRecord {
    validator_address: ValidatorAddressString
    rewards: ValidatorCurrentRewards
    constructor(validator_address: Bech32String, rewards: ValidatorCurrentRewards) {
        this.validator_address = validator_address
        this.rewards = rewards
    }
}

@json
export class DelegatorStartingInfo {
    previous_period: u64
    stake: f64
    height: u64 // LegacyDec
    constructor(
        previous_period: u64,
        stake: f64,
        height: u64,
    ) {
        this.previous_period = previous_period
        this.stake = stake
        this.height = height
    }
}

@json
export class DelegatorStartingInfoRecord {
    delegator_address: Bech32String
    validator_address: ValidatorAddressString
    starting_info: DelegatorStartingInfo
    constructor(delegator_address: Bech32String, validator_address: Bech32String, starting_info: DelegatorStartingInfo) {
        this.delegator_address = delegator_address
        this.validator_address = validator_address
        this.starting_info = starting_info
    }
}

@json
export class ValidatorSlashEvent {
    validator_period: u64
    fraction: f64 // LegacyDec
    constructor(
        validator_period: u64,
        fraction: f64,
    ) {
        this.validator_period = validator_period
        this.fraction = fraction
    }
}

@json
export class ValidatorSlashEventRecord {
    validator_address: ValidatorAddressString
    height: u64
    period: u64
    validator_slash_event: ValidatorSlashEvent
    constructor(validator_address: Bech32String, height: u64, period: u64, validator_slash_event: ValidatorSlashEvent) {
        this.validator_address = validator_address
        this.height = height
        this.period = period
        this.validator_slash_event = validator_slash_event
    }
}

@json
export class FeePool {
    community_pool: DecCoin[]
    constructor(community_pool: DecCoin[]) {
        this.community_pool = community_pool
    }
}


@json
export class ValidatorOutstandingRewards {
    rewards: DecCoin[]
    constructor(rewards: DecCoin[]) {
        this.rewards = rewards
    }
}

@json
export class ValidatorSlashEvents {
    validator_slash_events: ValidatorSlashEvent[]
    constructor(validator_slash_events: ValidatorSlashEvent[]) {
        this.validator_slash_events = validator_slash_events
    }
}

@json
export class CommunityPoolSpendProposal {
    title: string
    description: string
    recipient: string
    amount: Coin[]
    constructor(
        title: string,
        description: string,
        recipient: string,
        amount: Coin[],
    ) {
        this.title = title
        this.description = description
        this.recipient = recipient
        this.amount = amount
    }
}

@json
export class CommunityPoolSpendProposalWithDeposit {
    title: string
    description: string
    recipient: string
    amount: string
    deposit: string
    constructor(
        title: string,
        description: string,
        recipient: string,
        amount: string,
        deposit: string,
    ) {
        this.title = title
        this.description = description
        this.recipient = recipient
        this.amount = amount
        this.deposit = deposit
    }
}

@json
export class DelegationDelegatorReward {
    validator_address: ValidatorAddressString
    reward: DecCoin[]
    constructor(
        validator_address: ValidatorAddressString,
        reward: DecCoin[],
    ) {
        this.validator_address = validator_address
        this.reward = reward
    }
}

@json
export class GenesisState {
    params: Params
    fee_pool: FeePool
    delegator_withdraw_infos: DelegatorWithdrawInfo[]
    previous_proposer: Bech32String
    outstanding_rewards: ValidatorOutstandingRewardsRecord[]
    validator_accumulated_commissions: ValidatorAccumulatedCommissionRecord[]
    validator_historical_rewards: ValidatorHistoricalRewardsRecord[]
    validator_current_rewards: ValidatorCurrentRewardsRecord[]
    delegator_starting_infos: DelegatorStartingInfoRecord[]
    validator_slash_events: ValidatorSlashEventRecord[]
    base_denom: string
    rewards_denom: string
    constructor(
        params: Params,
        fee_pool: FeePool,
        delegator_withdraw_infos: DelegatorWithdrawInfo[],
        previous_proposer: Bech32String,
        outstanding_rewards: ValidatorOutstandingRewardsRecord[],
        validator_accumulated_commissions: ValidatorAccumulatedCommissionRecord[],
        validator_historical_rewards: ValidatorHistoricalRewardsRecord[],
        validator_current_rewards: ValidatorCurrentRewardsRecord[],
        delegator_starting_infos: DelegatorStartingInfoRecord[],
        validator_slash_events: ValidatorSlashEventRecord[],
        base_denom: string,
        rewards_denom: string,
    ) {
        this.params = params
        this.fee_pool = fee_pool
        this.delegator_withdraw_infos = delegator_withdraw_infos
        this.previous_proposer = previous_proposer
        this.outstanding_rewards = outstanding_rewards
        this.validator_accumulated_commissions = validator_accumulated_commissions
        this.validator_historical_rewards = validator_historical_rewards
        this.validator_current_rewards = validator_current_rewards
        this.delegator_starting_infos = delegator_starting_infos
        this.validator_slash_events = validator_slash_events
        this.base_denom = base_denom
        this.rewards_denom = rewards_denom
    }
}

@json
export class MsgSetWithdrawAddress {
    delegator_address: Bech32String
    withdraw_address: Bech32String
    constructor(
        delegator_address: Bech32String,
        withdraw_address: Bech32String,
    ) {
        this.delegator_address = delegator_address
        this.withdraw_address = withdraw_address
    }
}

@json
export class MsgSetWithdrawAddressResponse {
    constructor() {}
}

@json
export class MsgWithdrawDelegatorReward {
    delegator_address: Bech32String
    validator_address: ValidatorAddressString
    constructor(
        delegator_address: Bech32String,
        validator_address: ValidatorAddressString,
    ) {
        this.delegator_address = delegator_address
        this.validator_address = validator_address
    }
}

@json
export class MsgWithdrawDelegatorRewardResponse {
    amount: Coin[]
    constructor(amount: Coin[]) {
        this.amount = amount
    }
}

@json
export class MsgWithdrawValidatorCommission {
    validator_address: ValidatorAddressString
    constructor(validator_address: ValidatorAddressString) {
        this.validator_address = validator_address
    }
}

@json
export class MsgWithdrawValidatorCommissionResponse {
    amount: Coin[]
    constructor(amount: Coin[]) {
        this.amount = amount
    }
}

@json
export class MsgFundCommunityPool {
    amount: Coin[]
    depositor: Bech32String
    constructor(amount: Coin[], depositor: Bech32String) {
        this.amount = amount
        this.depositor = depositor
    }
}

@json
export class MsgFundCommunityPoolResponse {
    constructor() {}
}

@json
export class MsgUpdateParams {
    authority: Bech32String
    params: Params
    constructor(
        authority: Bech32String,
        params: Params,
    ) {
        this.authority = authority
        this.params = params
    }
}

@json
export class MsgUpdateParamsResponse {
    constructor() {}
}

@json
export class MsgCommunityPoolSpend {
    authority: Bech32String
    recipient: string
    amount: Coin[]
    constructor(
        authority: Bech32String,
        recipient: string,
        amount: Coin[],
    ) {
        this.authority = authority
        this.recipient = recipient
        this.amount = amount
    }
}

@json
export class MsgCommunityPoolSpendResponse {
    constructor() {}
}

@json
export class MsgDepositValidatorRewardsPool {
    depositor: Bech32String
    validator_address: ValidatorAddressString
    amount: Coin[]
    constructor(
        depositor: Bech32String,
        validator_address: ValidatorAddressString,
        amount: Coin[],
    ) {
        this.depositor = depositor
        this.validator_address = validator_address
        this.amount = amount
    }
}

@json
export class MsgDepositValidatorRewardsPoolResponse {
    constructor() {}
}

@json
export class QueryParamsRequest {
    constructor() {}
}

@json
export class QueryParamsResponse {
    params: Params
    constructor(params: Params) {
        this.params = params
    }
}

@json
export class QueryValidatorDistributionInfoRequest {
    validator_address: ValidatorAddressString
    constructor(validator_address: ValidatorAddressString) {
        this.validator_address = validator_address
    }
}

@json
export class QueryValidatorDistributionInfoResponse {
    operator_address: ValidatorAddressString
    self_bond_rewards: DecCoin[]
    commission: DecCoin[]
    constructor(
        operator_address: ValidatorAddressString,
        self_bond_rewards: DecCoin[],
        commission: DecCoin[],
    ) {
        this.operator_address = operator_address
        this.self_bond_rewards = self_bond_rewards
        this.commission = commission
    }
}

@json
export class QueryValidatorOutstandingRewardsRequest {
    validator_address: ValidatorAddressString
    constructor(validator_address: ValidatorAddressString) {
        this.validator_address = validator_address
    }
}

@json
export class QueryValidatorOutstandingRewardsResponse {
    rewards: ValidatorOutstandingRewards
    constructor(rewards: ValidatorOutstandingRewards) {
        this.rewards = rewards
    }
}

@json
export class QueryValidatorCommissionRequest {
    validator_address: ValidatorAddressString
    constructor(validator_address: ValidatorAddressString) {
        this.validator_address = validator_address
    }
}

@json
export class QueryValidatorCommissionResponse {
    commission: ValidatorAccumulatedCommission
    constructor(commission: ValidatorAccumulatedCommission) {
        this.commission = commission
    }
}

@json
export class QueryValidatorSlashesRequest {
    validator_address: ValidatorAddressString
    starting_height: u64
    ending_height: u64
    pagination: PageRequest
    constructor(
        validator_address: ValidatorAddressString,
        starting_height: u64,
        ending_height: u64,
        pagination: PageRequest,
    ) {
        this.validator_address = validator_address
        this.starting_height = starting_height
        this.ending_height = ending_height
        this.pagination = pagination
    }
}

@json
export class QueryValidatorSlashesResponse {
    slashes: ValidatorSlashEvent[]
    pagination: PageResponse
    constructor(
        slashes: ValidatorSlashEvent[],
        pagination: PageResponse,
    ) {
        this.slashes = slashes
        this.pagination = pagination
    }
}

@json
export class QueryDelegationRewardsRequest {
    delegator_address: Bech32String
    validator_address: ValidatorAddressString
    constructor(
        delegator_address: Bech32String,
        validator_address: ValidatorAddressString,
    ) {
        this.delegator_address = delegator_address
        this.validator_address = validator_address
    }
}

@json
export class QueryDelegationRewardsResponse {
    rewards: DecCoin[]
    constructor(rewards: DecCoin[]) {
        this.rewards = rewards
    }
}

@json
export class QueryDelegationTotalRewardsRequest {
    delegator_address: Bech32String
    constructor(delegator_address: Bech32String) {
        this.delegator_address = delegator_address
    }
}

@json
export class QueryDelegationTotalRewardsResponse {
    rewards: DelegationDelegatorReward[]
    total: DecCoin[]
    constructor(
        rewards: DelegationDelegatorReward[],
        total: DecCoin[],
    ) {
        this.rewards = rewards
        this.total = total
    }
}

@json
export class QueryDelegatorValidatorsRequest {
    delegator_address: Bech32String
    constructor(delegator_address: Bech32String) {
        this.delegator_address = delegator_address
    }
}

@json
export class QueryDelegatorValidatorsResponse {
    validators: Bech32String[]
    constructor(validators: Bech32String[]) {
        this.validators = validators
    }
}

@json
export class QueryDelegatorWithdrawAddressRequest {
    delegator_address: Bech32String
    constructor(delegator_address: Bech32String) {
        this.delegator_address = delegator_address
    }
}

@json
export class QueryDelegatorWithdrawAddressResponse {
    withdraw_address: Bech32String
    constructor(withdraw_address: Bech32String) {
        this.withdraw_address = withdraw_address
    }
}

@json
export class QueryCommunityPoolRequest {
    constructor() {}
}

@json
export class QueryCommunityPoolResponse {
    pool: DecCoin[]
    constructor(pool: DecCoin[]) {
        this.pool = pool
    }
}
