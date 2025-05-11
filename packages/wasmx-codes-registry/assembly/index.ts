import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataInstantiate, getCallDataWrap } from "./calldata";
import { SetCodeInfo, SetContractInfo, GetCodeInfo, GetContractInfo, GetContractInstance, InitGenesis, NewCodeInfo, GetLastCodeId, GetCodeInfoPrefix, GetContractInfoPrefix, setup } from "./actions";
import { revert } from "./utils";
import { onlyInternal } from "wasmx-env/assembly/utils";
import { MODULE_NAME } from "./types";

export function memory_assemblyscript_1(): void {}

export function wasmx_env_i32_2(): void {}

export function wasmx_env_core_i32_1(): void {}

export function instantiate(): void {
  const calld = getCallDataInstantiate()
  InitGenesis(calld)
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();

  // public operations
  if (calld.GetLastCodeId !== null) {
    result = GetLastCodeId();
  } else if (calld.GetCodeInfo !== null) {
    result = GetCodeInfo(calld.GetCodeInfo!);
  } else if (calld.GetContractInfo !== null) {
    result = GetContractInfo(calld.GetContractInfo!);
  } else if (calld.GetContractInstance !== null) {
    result = GetContractInstance(calld.GetContractInstance!);
  } else if (calld.GetCodeInfoPrefix != null) {
    result = GetCodeInfoPrefix();
  } else if (calld.GetContractInfoPrefix != null) {
    result = GetContractInfoPrefix();
  }

  // internal operations
  else if (calld.SetCodeInfo !== null) {
    onlyInternal(MODULE_NAME, "SetCodeInfo");
    result = SetCodeInfo(calld.SetCodeInfo!);
  } else if (calld.NewCodeInfo !== null) {
    onlyInternal(MODULE_NAME, "NewCodeInfo");
    result = NewCodeInfo(calld.NewCodeInfo!);
  } else if (calld.SetContractInfo !== null) {
    onlyInternal(MODULE_NAME, "SetContractInfo");
    result = SetContractInfo(calld.SetContractInfo!);
  } else if (calld.setup != null) {
    onlyInternal(MODULE_NAME, "setup");
    result = setup(calld.setup!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
