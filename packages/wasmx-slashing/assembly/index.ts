import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { AfterValidatorBonded, AfterValidatorCreated, BeginBlock, GetMissedBlockBitmap, GetParams, InitGenesis, SigningInfo, SigningInfos, Unjail, getValidatorInfo } from "./actions";
import { revert } from "./utils";
import { onlyInternal } from "wasmx-env/assembly/utils";
import { MODULE_NAME } from "./types";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();

  // public operations
  if (calld.SigningInfo != null) {
    result = SigningInfo(calld.SigningInfo!);
  } else if (calld.SigningInfos != null) {
    result = SigningInfos(calld.SigningInfos!);
  } else if (calld.Unjail !== null) {
    Unjail(calld.Unjail!);
  } else if (calld.Params !== null) {
    result = GetParams(calld.Params!);
  } else if (calld.GetMissedBlockBitmap != null) {
    result = GetMissedBlockBitmap(calld.GetMissedBlockBitmap!);
  }

  // internal operations
  else if (calld.InitGenesis !== null) {
    onlyInternal(MODULE_NAME, "InitGenesis");
    result = InitGenesis(calld.InitGenesis!);
  } else if (calld.BeginBlock !== null) {
    onlyInternal(MODULE_NAME, "BeginBlock");
    BeginBlock(calld.BeginBlock!);
  } else if (calld.AfterValidatorCreated !== null) {
    onlyInternal(MODULE_NAME, "AfterValidatorCreated");
    AfterValidatorCreated(calld.AfterValidatorCreated!);
  } else if (calld.AfterValidatorBonded !== null) {
    onlyInternal(MODULE_NAME, "AfterValidatorBonded");
    AfterValidatorBonded(calld.AfterValidatorBonded!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
