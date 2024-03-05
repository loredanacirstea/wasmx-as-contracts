import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getName, getSymbol, getDecimals, totalSupply, balanceOf, transfer, transferFrom, approve, allowance, instantiateToken } from "wasmx-erc20/assembly/actions";
import { CallData, getCallDataWrap } from './calldata';
import { delegate, redelegate, undelegate, GetAllSDKDelegations, GetDelegation, balanceOfValidator } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  instantiateToken()
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.name !== null) {
    result = getName();
  } else if (calld.symbol !== null) {
    result = getSymbol();
  } else if (calld.decimals !== null) {
    result = getDecimals();
  } else if (calld.totalSupply !== null) {
    result = totalSupply();
  } else if (calld.balanceOf !== null) {
    result = balanceOf(calld.balanceOf!);
  } else if (calld.balanceOfValidator !== null) {
    result = balanceOfValidator(calld.balanceOfValidator!);
  } else if (calld.delegate !== null) {
    result = delegate(calld.delegate!);
  } else if (calld.redelegate !== null) {
    result = redelegate(calld.redelegate!);
  } else if (calld.undelegate !== null) {
    result = undelegate(calld.undelegate!);
  } else if (calld.GetDelegation !== null) {
    result = GetDelegation(calld.GetDelegation!);
  } else if (calld.GetAllSDKDelegations !== null) {
    result = GetAllSDKDelegations(calld.GetAllSDKDelegations!);
  } else if (calld.approve !== null) {
    result = approve(calld.approve!);
  } else if (calld.allowance !== null) {
    result = allowance(calld.allowance!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
