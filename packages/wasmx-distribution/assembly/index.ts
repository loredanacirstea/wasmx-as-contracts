import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { CommunityPool, CommunityPoolSpend, DelegationRewards, DelegationTotalRewards, DelegatorValidators, DelegatorWithdrawAddress, DepositValidatorRewardsPool, FundCommunityPool, InitGenesis, Params, SetWithdrawAddress, UpdateParams, ValidatorCommission, ValidatorDistributionInfo, ValidatorOutstandingRewards, ValidatorSlashes, WithdrawDelegatorReward, WithdrawValidatorCommission, EndBlock as EndBlockInternal } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

// TODO register invariants

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.EndBlock !== null) {
    EndBlockInternal(calld.EndBlock!);
  } else if (calld.SetWithdrawAddress !== null) {
    result = SetWithdrawAddress(calld.SetWithdrawAddress!);
  } else if (calld.WithdrawDelegatorReward !== null) {
    result = WithdrawDelegatorReward(calld.WithdrawDelegatorReward!);
  } else if (calld.WithdrawValidatorCommission !== null) {
    result = WithdrawValidatorCommission(calld.WithdrawValidatorCommission!);
  } else if (calld.FundCommunityPool !== null) {
    result = FundCommunityPool(calld.FundCommunityPool!);
  } else if (calld.UpdateParams !== null) {
    result = UpdateParams(calld.UpdateParams!);
  } else if (calld.CommunityPoolSpend !== null) {
    result = CommunityPoolSpend(calld.CommunityPoolSpend!);
  } else if (calld.DepositValidatorRewardsPool !== null) {
    result = DepositValidatorRewardsPool(calld.DepositValidatorRewardsPool!);
  } else if (calld.Params !== null) {
    result = Params(calld.Params!);
  } else if (calld.ValidatorDistributionInfo !== null) {
    result = ValidatorDistributionInfo(calld.ValidatorDistributionInfo!);
  } else if (calld.ValidatorOutstandingRewards !== null) {
    result = ValidatorOutstandingRewards(calld.ValidatorOutstandingRewards!);
  } else if (calld.ValidatorCommission !== null) {
    result = ValidatorCommission(calld.ValidatorCommission!);
  } else if (calld.ValidatorSlashes !== null) {
    result = ValidatorSlashes(calld.ValidatorSlashes!);
  } else if (calld.DelegationRewards !== null) {
    result = DelegationRewards(calld.DelegationRewards!);
  } else if (calld.DelegationTotalRewards !== null) {
    result = DelegationTotalRewards(calld.DelegationTotalRewards!);
  } else if (calld.DelegatorValidators !== null) {
    result = DelegatorValidators(calld.DelegatorValidators!);
  } else if (calld.DelegatorWithdrawAddress !== null) {
    result = DelegatorWithdrawAddress(calld.DelegatorWithdrawAddress!);
  } else if (calld.CommunityPool !== null) {
    result = CommunityPool(calld.CommunityPool!);
  } else if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

// TODO when we can call the endopoint from the hooks contract
export function EndBlock(): void {
  // call EndBlock
}
