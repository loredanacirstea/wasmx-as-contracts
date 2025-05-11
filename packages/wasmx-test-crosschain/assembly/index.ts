import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataInitialize, getCallDataWrap } from './calldata';
import { revert } from "./utils";
import { CrossChain, CrossChainQuery } from "./actions";
import { setCrossChainContract } from "./storage";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const calld = getCallDataInitialize();
  setCrossChainContract(calld.crosschain_contract)
}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.CrossChain !== null) {
    result = CrossChain(calld.CrossChain!);
  } else if (calld.CrossChainQuery !== null) {
    result = CrossChainQuery(calld.CrossChainQuery!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
