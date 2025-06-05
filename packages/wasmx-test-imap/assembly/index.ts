import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import { Close, ConnectOAuth2, ConnectWithPassword, Count, CreateFolder, Fetch, Listen, ListMailboxes } from "./actions";
import { revert } from "./utils";

export function wasmx_env_2(): void {}

export function wasmx_sql_1(): void {}
export function wasmx_imap_i32_1(): void {}

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
  } else if (calld.Fetch !== null) {
    result = Fetch(calld.Fetch!);
  } else if (calld.Listen !== null) {
    result = Listen(calld.Listen!);
  } else if (calld.CreateFolder !== null) {
    result = CreateFolder(calld.CreateFolder!);
  } else if (calld.Count !== null) {
    result = Count(calld.Count!);
  } else if (calld.ListMailboxes !== null) {
    result = ListMailboxes(calld.ListMailboxes!);
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
