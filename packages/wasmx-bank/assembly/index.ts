import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { InitGenesis, Send, MultiSend, UpdateParams, SetSendEnabled } from "./actions";
import { CallDataInstantiate } from "./types"
import { setAuthorities } from "./storage";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const calldraw = wasmx.getCallData();
  const calld = JSON.parse<CallDataInstantiate>(String.UTF8.decode(calldraw));
  setAuthorities(calld.authorities)
}

export function main(): void {
  let result: ArrayBuffer;
  const calld = getCallDataWrap();
  if (calld.Send !== null) {
    Send(calld.Send!);
    result = new ArrayBuffer(0)
  } else if (calld.MultiSend !== null) {
    result = MultiSend(calld.MultiSend!);
  } else if (calld.UpdateParams !== null) {
    result = UpdateParams(calld.UpdateParams!);
  } else if (calld.SetSendEnabled !== null) {
    result = SetSendEnabled(calld.SetSendEnabled!);
  } else if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else {
    wasmx.revert(String.UTF8.encode("invalid function call data"));
    throw new Error("invalid function call data");
  }
  wasmx.finish(result);
}
