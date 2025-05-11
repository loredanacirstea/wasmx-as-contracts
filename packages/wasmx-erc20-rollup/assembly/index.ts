import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import * as erc20 from "wasmx-erc20/assembly/actions";
import * as actions from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function wasmx_crosschain_1(): void {}

export function instantiate(): void {
  actions.instantiateToken()
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.name !== null) {
    result = erc20.getName();
  } else if (calld.symbol !== null) {
    result = erc20.getSymbol();
  } else if (calld.decimals !== null) {
    result = erc20.getDecimals();
  } else if (calld.totalSupply !== null) {
    result = erc20.totalSupply();
  } else if (calld.balanceOf !== null) {
    result = erc20.balanceOf(calld.balanceOf!);
  } else if (calld.transfer !== null) {
    result = erc20.transfer(calld.transfer!);
  } else if (calld.transferFrom !== null) {
    result = erc20.transferFrom(calld.transferFrom!);
  } else if (calld.approve !== null) {
    result = erc20.approve(calld.approve!);
  } else if (calld.allowance !== null) {
    result = erc20.allowance(calld.allowance!);
  } else if (calld.mint !== null) {
    result = erc20.mint(calld.mint!);
  } else if (calld.burn !== null) {
    result = erc20.burn(calld.burn!);
  } else if (calld.transferCrossChain !== null) {
    result = actions.transferCrossChain(calld.transferCrossChain!);
  } else if (calld.transferFromCrossChain !== null) {
    result = actions.transferFromCrossChain(calld.transferFromCrossChain!);
  } else if (calld.balanceOfCrossChain !== null) {
    result = actions.balanceOfCrossChain(calld.balanceOfCrossChain!);
  } else if (calld.totalSupplyCrossChain !== null) {
    result = actions.totalSupplyCrossChain(calld.totalSupplyCrossChain!);
  } else if (calld.balanceOfCrossChainNonDeterministic !== null) {
    result = actions.balanceOfCrossChainNonDeterministic(calld.balanceOfCrossChainNonDeterministic!);
  } else if (calld.totalSupplyCrossChainNonDeterministic !== null) {
    result = actions.totalSupplyCrossChainNonDeterministic(calld.totalSupplyCrossChainNonDeterministic!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
