import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataInitialize, getCallDataWrap } from './calldata';
import { ConvertAddressByChainId, CrossChainQuery, CrossChainQueryNonDeterministic, CrossChainTx, GetCurrentLevel, GetSubChainById, GetSubChainConfigById, GetSubChainIds, GetSubChainIdsByLevel, GetSubChainIdsByValidator, GetSubChains, GetSubChainsByIds, GetValidatorAddressesByChainId, GetValidatorsByChainId, InitSubChain, RegisterDefaultSubChain, RegisterSubChain, RegisterSubChainValidator, RemoveSubChain } from "./actions";
import { revert } from "./utils";
import { setParams } from "./storage";

export function wasmx_env_2(): void {}

export function wasmx_crosschain_1(): void {}

export function instantiate(): void {
  const calld = getCallDataInitialize()
  setParams(calld.params);
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.InitSubChain !== null) {
    result = InitSubChain(calld.InitSubChain!);
  } else if (calld.RegisterSubChain !== null) {
    result = RegisterSubChain(calld.RegisterSubChain!);
  } else if (calld.RegisterDefaultSubChain !== null) {
    result = RegisterDefaultSubChain(calld.RegisterDefaultSubChain!);
  } else if (calld.RegisterSubChainValidator !== null) {
    result = RegisterSubChainValidator(calld.RegisterSubChainValidator!);
  } else if (calld.RemoveSubChain !== null) {
    result = RemoveSubChain(calld.RemoveSubChain!);
  } else if (calld.GetSubChainById !== null) {
    result = GetSubChainById(calld.GetSubChainById!);
  } else if (calld.GetSubChainConfigById !== null) {
    result = GetSubChainConfigById(calld.GetSubChainConfigById!);
  } else if (calld.GetSubChainsByIds !== null) {
    result = GetSubChainsByIds(calld.GetSubChainsByIds!);
  } else if (calld.GetSubChains !== null) {
    result = GetSubChains(calld.GetSubChains!);
  } else if (calld.GetSubChainIds !== null) {
    result = GetSubChainIds(calld.GetSubChainIds!);
  } else if (calld.GetSubChainIdsByLevel !== null) {
    result = GetSubChainIdsByLevel(calld.GetSubChainIdsByLevel!);
  } else if (calld.GetSubChainIdsByValidator !== null) {
    result = GetSubChainIdsByValidator(calld.GetSubChainIdsByValidator!);
  } else if (calld.GetValidatorsByChainId !== null) {
    result = GetValidatorsByChainId(calld.GetValidatorsByChainId!);
  } else if (calld.GetValidatorAddressesByChainId !== null) {
    result = GetValidatorAddressesByChainId(calld.GetValidatorAddressesByChainId!);
  } else if (calld.ConvertAddressByChainId !== null) {
    result = ConvertAddressByChainId(calld.ConvertAddressByChainId!);
  } else if (calld.GetCurrentLevel !== null) {
    result = GetCurrentLevel(calld.GetCurrentLevel!);
  } else if (calld.CrossChainTx !== null) {
    result = CrossChainTx(calld.CrossChainTx!);
  } else if (calld.CrossChainQuery !== null) {
    result = CrossChainQuery(calld.CrossChainQuery!);
  } else if (calld.CrossChainQueryNonDeterministic !== null) {
    result = CrossChainQueryNonDeterministic(calld.CrossChainQueryNonDeterministic!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
