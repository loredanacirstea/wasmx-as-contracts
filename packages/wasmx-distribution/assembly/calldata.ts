import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgCommunityPoolSpend, MsgDepositValidatorRewardsPool, MsgFundCommunityPool, MsgInitGenesis, MsgSetWithdrawAddress, MsgUpdateParams, MsgWithdrawDelegatorReward, MsgWithdrawValidatorCommission, QueryCommunityPoolRequest, QueryDelegationRewardsRequest, QueryDelegationTotalRewardsRequest, QueryDelegatorValidatorsRequest, QueryDelegatorWithdrawAddressRequest, QueryParamsRequest, QueryValidatorCommissionRequest, QueryValidatorDistributionInfoRequest, QueryValidatorOutstandingRewardsRequest, QueryValidatorSlashesRequest } from './types';
import { MsgRunHook } from "wasmx-hooks/assembly/types";

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: MsgInitGenesis | null = null;

    // msg
    SetWithdrawAddress: MsgSetWithdrawAddress | null = null;
    WithdrawDelegatorReward: MsgWithdrawDelegatorReward | null = null;
    WithdrawValidatorCommission: MsgWithdrawValidatorCommission | null = null;
    FundCommunityPool: MsgFundCommunityPool | null = null;
    UpdateParams: MsgUpdateParams | null = null;
    CommunityPoolSpend: MsgCommunityPoolSpend | null = null;
    DepositValidatorRewardsPool: MsgDepositValidatorRewardsPool | null = null;

    // queries
    Params: QueryParamsRequest | null = null;
    ValidatorDistributionInfo: QueryValidatorDistributionInfoRequest | null = null;
    ValidatorOutstandingRewards: QueryValidatorOutstandingRewardsRequest | null = null;
    ValidatorCommission: QueryValidatorCommissionRequest | null = null;
    ValidatorSlashes: QueryValidatorSlashesRequest | null = null;
    DelegationRewards: QueryDelegationRewardsRequest | null = null;
    DelegationTotalRewards: QueryDelegationTotalRewardsRequest | null = null;
    DelegatorValidators: QueryDelegatorValidatorsRequest | null = null;
    DelegatorWithdrawAddress: QueryDelegatorWithdrawAddressRequest | null = null;
    CommunityPool: QueryCommunityPoolRequest | null = null;

    // hook
    EndBlock: MsgRunHook | null = null;
}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}
