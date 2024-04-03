import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCommunityPoolSpend, MsgCommunityPoolSpendResponse, MsgDepositValidatorRewardsPool, MsgDepositValidatorRewardsPoolResponse, MsgFundCommunityPool, MsgFundCommunityPoolResponse, MsgInitGenesis, MsgSetWithdrawAddress, MsgSetWithdrawAddressResponse, MsgUpdateParams, MsgUpdateParamsResponse, MsgWithdrawDelegatorReward, MsgWithdrawDelegatorRewardResponse, MsgWithdrawValidatorCommission, MsgWithdrawValidatorCommissionResponse, QueryCommunityPoolRequest, QueryCommunityPoolResponse, QueryDelegationRewardsRequest, QueryDelegationRewardsResponse, QueryDelegationTotalRewardsRequest, QueryDelegationTotalRewardsResponse, QueryDelegatorValidatorsRequest, QueryDelegatorValidatorsResponse, QueryDelegatorWithdrawAddressRequest, QueryDelegatorWithdrawAddressResponse, QueryParamsRequest, QueryParamsResponse, QueryValidatorCommissionRequest, QueryValidatorCommissionResponse, QueryValidatorDistributionInfoRequest, QueryValidatorDistributionInfoResponse, QueryValidatorOutstandingRewardsRequest, QueryValidatorOutstandingRewardsResponse, QueryValidatorSlashesRequest, QueryValidatorSlashesResponse } from './types';
import { revert } from "./utils";

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    return new ArrayBuffer(0);
}

export function SetWithdrawAddress(req: MsgSetWithdrawAddress): ArrayBuffer {
    return String.UTF8.encode(JSON.stringify<MsgSetWithdrawAddressResponse>(new MsgSetWithdrawAddressResponse()))
}

export function WithdrawDelegatorReward(req: MsgWithdrawDelegatorReward): ArrayBuffer {
    revert(`WithdrawDelegatorReward not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<MsgWithdrawDelegatorRewardResponse>(new MsgWithdrawDelegatorRewardResponse()))
}

export function WithdrawValidatorCommission(req: MsgWithdrawValidatorCommission): ArrayBuffer {
    revert(`WithdrawValidatorCommission not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<MsgWithdrawValidatorCommissionResponse>(new MsgWithdrawValidatorCommissionResponse()))
}

export function FundCommunityPool(req: MsgFundCommunityPool): ArrayBuffer {
    return String.UTF8.encode(JSON.stringify<MsgFundCommunityPoolResponse>(new MsgFundCommunityPoolResponse()))
}

export function UpdateParams(req: MsgUpdateParams): ArrayBuffer {
    return String.UTF8.encode(JSON.stringify<MsgUpdateParamsResponse>(new MsgUpdateParamsResponse()))
}

export function CommunityPoolSpend(req: MsgCommunityPoolSpend): ArrayBuffer {
    return String.UTF8.encode(JSON.stringify<MsgCommunityPoolSpendResponse>(new MsgCommunityPoolSpendResponse()))
}

export function DepositValidatorRewardsPool(req: MsgDepositValidatorRewardsPool): ArrayBuffer {
    return String.UTF8.encode(JSON.stringify<MsgDepositValidatorRewardsPoolResponse>(new MsgDepositValidatorRewardsPoolResponse()))
}

export function Params(req: QueryParamsRequest): ArrayBuffer {
    revert(`Params not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryParamsResponse>(new QueryParamsResponse()))
}

export function ValidatorDistributionInfo(req: QueryValidatorDistributionInfoRequest): ArrayBuffer {
    revert(`ValidatorDistributionInfo not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryValidatorDistributionInfoResponse>(new QueryValidatorDistributionInfoResponse()))
}

export function ValidatorOutstandingRewards(req: QueryValidatorOutstandingRewardsRequest): ArrayBuffer {
    revert(`ValidatorOutstandingRewards not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryValidatorOutstandingRewardsResponse>(new QueryValidatorOutstandingRewardsResponse()))
}

export function ValidatorCommission(req: QueryValidatorCommissionRequest): ArrayBuffer {
    revert(`ValidatorCommission not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryValidatorCommissionResponse>(new QueryValidatorCommissionResponse()))
}

export function ValidatorSlashes(req: QueryValidatorSlashesRequest): ArrayBuffer {
    revert(`ValidatorSlashes not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryValidatorSlashesResponse>(new QueryValidatorSlashesResponse()))
}

export function DelegationRewards(req: QueryDelegationRewardsRequest): ArrayBuffer {
    revert(`DelegationRewards not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryDelegationRewardsResponse>(new QueryDelegationRewardsResponse()))
}

export function DelegationTotalRewards(req: QueryDelegationTotalRewardsRequest): ArrayBuffer {
    revert(`DelegationTotalRewards not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryDelegationTotalRewardsResponse>(new QueryDelegationTotalRewardsResponse()))
}

export function DelegatorValidators(req: QueryDelegatorValidatorsRequest): ArrayBuffer {
    revert(`DelegatorValidators not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryDelegatorValidatorsResponse>(new QueryDelegatorValidatorsResponse()))
}

export function DelegatorWithdrawAddress(req: QueryDelegatorWithdrawAddressRequest): ArrayBuffer {
    revert(`DelegatorWithdrawAddress not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryDelegatorWithdrawAddressResponse>(new QueryDelegatorWithdrawAddressResponse()))
}

export function CommunityPool(req: QueryCommunityPoolRequest): ArrayBuffer {
    revert(`CommunityPool not implemented`);
    return new ArrayBuffer(0)
    // return String.UTF8.encode(JSON.stringify<QueryCommunityPoolResponse>(new QueryCommunityPoolResponse()))
}
