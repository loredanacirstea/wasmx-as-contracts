import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap, getCallDataWrapReentry } from './calldata';
import { revert } from "./utils";
import { CacheEmail, Initialize, ListenEmail, RegisterProvider, SendEmail, ConnectUser, IncomingEmail, Expunge, Metadata } from "./actions";

export function wasmx_env_2(): void {}

export function wasmx_sql_1(): void {}
export function wasmx_imap_1(): void {}
export function wasmx_smtp_1(): void {}

export function instantiate(): void {
  // const calld = getCallDataInstantiateWrap()
  // Initialize(calld)
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.Initialize !== null) {
    result = Initialize(calld.Initialize!);
  } else if (calld.RegisterProvider !== null) {
    result = RegisterProvider(calld.RegisterProvider!);
  } else if (calld.ConnectUser !== null) {
    result = ConnectUser(calld.ConnectUser!);
  } else if (calld.CacheEmail !== null) {
    result = CacheEmail(calld.CacheEmail!);
  } else if (calld.ListenEmail !== null) {
    result = ListenEmail(calld.ListenEmail!);
  } else if (calld.SendEmail !== null) {
    result = SendEmail(calld.SendEmail!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

export function imap_update(): void {
  const calld = getCallDataWrapReentry();
  if (calld.IncomingEmail !== null) {
    IncomingEmail(calld.IncomingEmail!);
  } else if (calld.Expunge !== null) {
    Expunge(calld.Expunge!);
  } else if (calld.Metadata !== null) {
    Metadata(calld.Metadata!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`imap_update: invalid function call data: ${calldstr}`);
  }
}
