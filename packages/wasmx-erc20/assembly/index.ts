import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { CallData, getCallDataWrap } from './calldata';
import { name, symbol, decimals, totalSupply, balanceOf, transfer, transferFrom, approve, allowance } from "./actions";
import { setOwner } from "./storage";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const owner = wasmxw.getCaller()
  setOwner(owner);
}

export function main(): void {
  let result: ArrayBuffer;
  const calld = getCallDataWrap();
  if (calld.name !== null) {
    result = name();
  } else if (calld.symbol !== null) {
    result = symbol();
  } else if (calld.decimals !== null) {
    result = decimals();
  } else if (calld.totalSupply !== null) {
    result = totalSupply();
  } else if (calld.balanceOf !== null) {
    result = balanceOf(calld.balanceOf!);
  } else if (calld.transfer !== null) {
    result = transfer(calld.transfer!);
  } else if (calld.transferFrom !== null) {
    result = transferFrom(calld.transferFrom!);
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
