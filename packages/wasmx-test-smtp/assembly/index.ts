import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import { Close, Quit, ConnectOAuth2, ConnectWithPassword, Extension, MaxMessageSize, Noop, SendMail, SupportsAuth, Verify, BuildMail } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function wasmx_sql_1(): void {}
export function wasmx_smtp_i32_1(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.ConnectWithPassword !== null) {
    result = ConnectWithPassword(calld.ConnectWithPassword!);
  } else if (calld.ConnectOAuth2 !== null) {
    result = ConnectOAuth2(calld.ConnectOAuth2!);
  } else if (calld.Close !== null) {
    result = Close(calld.Close!);
  } else if (calld.Quit !== null) {
    result = Quit(calld.Quit!);
  } else if (calld.Extension !== null) {
    result = Extension(calld.Extension!);
  } else if (calld.Noop !== null) {
    result = Noop(calld.Noop!);
  } else if (calld.SendMail !== null) {
    result = SendMail(calld.SendMail!);
  } else if (calld.Verify !== null) {
    result = Verify(calld.Verify!);
  } else if (calld.SupportsAuth !== null) {
    result = SupportsAuth(calld.SupportsAuth!);
  } else if (calld.MaxMessageSize !== null) {
    result = MaxMessageSize(calld.MaxMessageSize!);
  } else if (calld.BuildMail !== null) {
    result = BuildMail(calld.BuildMail!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

// called when a mailbox change occurs
export function imap(): void {
  console.log("* imap listener change")
}
