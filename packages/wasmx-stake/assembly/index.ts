import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { InitGenesis, CreateValidator, UpdateValidators, GetAllValidators, GetValidator, GetDelegation, GetPool, ValidatorByConsAddr, ValidatorByHexAddr, GetValidatorDelegations, GetDelegatorValidators, GetDelegatorValidatorAddresses, GetParams, GetAllValidatorInfos, setup, stop, IsValidatorJailed, Slash, SlashWithInfractionReason, Jail, Unjail, ConsensusAddressByOperatorAddress } from "./actions";
import { revert } from "./utils";
import { onlyInternal } from "wasmx-env/assembly/utils";
import { MODULE_NAME } from "./types";

export function memory_assemblyscript_1(): void {}

export function wasmx_env_i32_2(): void {}

export function wasmx_env_core_i32_1(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();

  // public operations
  if (calld.CreateValidator !== null) {
    CreateValidator(calld.CreateValidator!);
    result = new ArrayBuffer(0)
  } else if (calld.GetAllValidators !== null) {
    result = GetAllValidators();
  } else if (calld.GetAllValidatorInfos !== null) {
    result = GetAllValidatorInfos();
  } else if (calld.GetValidator !== null) {
    result = GetValidator(calld.GetValidator!);
  } else if (calld.ValidatorByHexAddr !== null) {
    result = ValidatorByHexAddr(calld.ValidatorByHexAddr!);
  } else if (calld.GetDelegation !== null) {
    result = GetDelegation(calld.GetDelegation!);
  } else if (calld.ValidatorByConsAddr !== null) {
    result = ValidatorByConsAddr(calld.ValidatorByConsAddr!);
  } else if (calld.GetValidatorDelegations !== null) {
    result = GetValidatorDelegations(calld.GetValidatorDelegations!);
  } else if (calld.GetDelegatorValidators !== null) {
    result = GetDelegatorValidators(calld.GetDelegatorValidators!);
  } else if (calld.GetDelegatorValidatorAddresses !== null) {
    result = GetDelegatorValidatorAddresses(calld.GetDelegatorValidatorAddresses!);
  } else if (calld.GetPool !== null) {
    result = GetPool(calld.GetPool!);
  } else if (calld.Params !== null) {
    result = GetParams(calld.Params!);
  } else if (calld.IsValidatorJailed !== null) {
    result = IsValidatorJailed(calld.IsValidatorJailed!);
  } else if (calld.ConsensusAddressByOperatorAddress !== null) {
    result = ConsensusAddressByOperatorAddress(calld.ConsensusAddressByOperatorAddress!);
  }

  // internal operations
  else if (calld.Slash !== null) {
    onlyInternal(MODULE_NAME, "Slash");
    result = Slash(calld.Slash!);
  } else if (calld.SlashWithInfractionReason !== null) {
    onlyInternal(MODULE_NAME, "SlashWithInfractionReason");
    result = SlashWithInfractionReason(calld.SlashWithInfractionReason!);
  } else if (calld.Jail !== null) {
    onlyInternal(MODULE_NAME, "Jail");
    result = Jail(calld.Jail!);
  } else if (calld.Unjail !== null) {
    onlyInternal(MODULE_NAME, "Unjail");
    result = Unjail(calld.Unjail!);
  } else if (calld.UpdateValidators !== null) {
    onlyInternal(MODULE_NAME, "UpdateValidators");
    result = UpdateValidators(calld.UpdateValidators!);
  } else if (calld.InitGenesis !== null) {
    onlyInternal(MODULE_NAME, "InitGenesis");
    result = InitGenesis(calld.InitGenesis!);
  } else if (calld.setup !== null) {
    onlyInternal(MODULE_NAME, "setup");
    result = setup(calld.setup!);
  } else if (calld.stop !== null) {
    onlyInternal(MODULE_NAME, "stop");
    result = stop();
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
