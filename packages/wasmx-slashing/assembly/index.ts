import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { AfterValidatorBonded, AfterValidatorCreated, BeginBlock, GetMissedBlockBitmap, GetParams, InitGenesis, SigningInfo, SigningInfos, Unjail, getValidatorInfo } from "./actions";
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
  } else if (calld.Unjail !== null) {
    Unjail(calld.Unjail!);
  } else if (calld.Params !== null) {
    result = GetParams(calld.Params!);
  } else if (calld.GetMissedBlockBitmap != null) {
    result = GetMissedBlockBitmap(calld.GetMissedBlockBitmap!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
