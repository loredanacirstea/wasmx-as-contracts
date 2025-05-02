import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import { getName, getSymbol, getDecimals, totalSupply, balanceOf, transfer, transferFrom, approve, allowance, instantiateToken} from "./actions";
import { LoggerDebug, revert } from "./utils";
import { CallDataInstantiate } from "./types";

export function wasmx_env_2(): void {}


export function instantiate(): void {}

export function activate(): void {
  const calldraw = wasmx.getCallData();
  const calldrawstr = String.UTF8.decode(calldraw);
  LoggerDebug("instantiate token", ["args", calldrawstr])
  const calld = JSON.parse<CallDataInstantiate>(calldrawstr);
  instantiateToken(calld)
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
  } else if (calld.transfer !== null) {
    result = transfer(calld.transfer!);
  } else if (calld.transferFrom !== null) {
    result = transferFrom(calld.transferFrom!);
  } else if (calld.approve !== null) {
    result = approve(calld.approve!);
  } else if (calld.allowance !== null) {
    result = allowance(calld.allowance!);
  } else if (calld.instantiate !== null) {
    instantiateToken(calld.instantiate!); // TODO remove
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
