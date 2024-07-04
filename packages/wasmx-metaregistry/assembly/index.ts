import { JSON } from "json-as/assembly";
import * as wasmx from "wasmx-env/assembly/wasmx";
import { getCallDataInitialize, getCallDataWrap, HookCalld } from "./calldata";
import { setParams } from "./storage";
import { revert } from "./utils";
import * as actions from "./actions";

export function wasmx_env_2(): void {}

export function wasmx_crosschain_1(): void {}

export function instantiate(): void {
  const calld = getCallDataInitialize()
  setParams(calld.params);
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.SetChainData !== null) {
    result = actions.SetChainData(calld.SetChainData!);
  } else if (calld.CrossChainTx !== null) {
    result = actions.CrossChainTx(calld.CrossChainTx!);
  } else if (calld.CrossChainQuery !== null) {
    result = actions.CrossChainQuery(calld.CrossChainQuery!);
  } else if (calld.CrossChainQueryNonDeterministic !== null) {
    result = actions.CrossChainQueryNonDeterministic(calld.CrossChainQueryNonDeterministic!);
  } else if (calld.NewSubChain !== null) {
    actions.NewSubChain(calld.NewSubChain!)
    result = new ArrayBuffer(0);
  } else if (calld.GetChainData !== null) {
    result = actions.GetChainData(calld.GetChainData!);
  } else if (calld.GetSubChainConfigById !== null) {
    result = actions.GetSubChainConfigById(calld.GetSubChainConfigById!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

export function NewSubChain(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const calldraw = wasmx.getCallData();
  let calldstr = String.UTF8.decode(calldraw)
  const calld = JSON.parse<HookCalld>(calldstr);
  actions.NewSubChain(calld)
  // we may have set the return data during execution
  result = wasmx.getFinishData();
  wasmx.finish(result);
}
