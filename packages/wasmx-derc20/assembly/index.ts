import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getName, getSymbol, getDecimals, totalSupply, balanceOf, transfer, transferFrom, approve, allowance, instantiateToken } from "wasmx-erc20/assembly/actions";
import { CallData, getCallDataWrap } from './calldata';
import { delegate, redelegate, undelegate } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  instantiateToken()
}

export function main(): void {
  let result: ArrayBuffer;
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
  } else if (calld.delegate !== null) {
    result = delegate(calld.delegate!);
  } else if (calld.redelegate !== null) {
    result = redelegate(calld.redelegate!);
  } else if (calld.undelegate !== null) {
    result = undelegate(calld.undelegate!);
  } else if (calld.approve !== null) {
    result = approve(calld.approve!);
  } else if (calld.allowance !== null) {
    result = allowance(calld.allowance!);
  } else {
    wasmx.revert(String.UTF8.encode("invalid function call data"));
    throw new Error("invalid function call data");
  }
  wasmx.finish(result);
}
