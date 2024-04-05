import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { InitGenesis, CreateValidator, UpdateValidators, GetAllValidators, GetValidator, GetDelegation, GetPool, ValidatorByConsAddr, ValidatorByHexAddr, GetValidatorDelegations, GetDelegatorValidators, GetDelegatorValidatorAddresses, GetParams } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.CreateValidator !== null) {
    CreateValidator(calld.CreateValidator!);
    result = new ArrayBuffer(0)
  } else if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else if (calld.GetAllValidators !== null) {
    result = GetAllValidators();
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
  } else if (calld.UpdateValidators !== null) {
    result = UpdateValidators(calld.UpdateValidators!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
