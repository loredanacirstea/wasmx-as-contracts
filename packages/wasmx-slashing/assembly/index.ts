import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { AfterValidatorBonded, AfterValidatorCreated, BeginBlock, InitGenesis, SigningInfo, SigningInfos, getValidatorInfo } from "./actions";
import { revert } from "./utils";


export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else if (calld.SigningInfo != null) {
    result = SigningInfo(calld.SigningInfo!);
  } else if (calld.SigningInfos != null) {
    result = SigningInfos(calld.SigningInfos!);
  } else if (calld.BeginBlock !== null) {
    BeginBlock(calld.BeginBlock!);
  } else if (calld.AfterValidatorCreated !== null) {
    AfterValidatorCreated(calld.AfterValidatorCreated!);
  } else if (calld.AfterValidatorBonded !== null) {
    AfterValidatorBonded(calld.AfterValidatorBonded!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
