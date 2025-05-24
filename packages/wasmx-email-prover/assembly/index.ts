import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as roles from "wasmx-env/assembly/roles";
import { getCallDataWrap, getCallDataWrapReentry, getCallDataWrapInitialize, getCallDataWrapRoleChanged, getCallDataWrapIncomingRequest } from './calldata';
import { revert } from "./utils";
import { CacheEmail, Initialize, ListenEmail, RegisterProviders, SendEmail, ConnectUser, IncomingEmail, Expunge, Metadata } from "./actions";
import { getInitializeData, setInitializeData } from "./storage";
import { RolesChangedHook } from "wasmx-roles/assembly/types";
import { shouldActivate } from "wasmx-roles/assembly/sdk";
import { RoleChangedActionType } from "wasmx-env/assembly/types";
import { MODULE_NAME } from "./types";
import { onlyRole } from "wasmx-env/assembly/utils";
import { HttpRequestHandler } from "./http";

export function wasmx_env_2(): void {}
export function wasmx_sql_1(): void {}
export function wasmx_imap_1(): void {}
export function wasmx_smtp_1(): void {}
export function wasmx_oauth2client_1(): void {}
// TODO remove, we need this for temporary JWT functions
export function wasmx_httpserver_1(): void {}

export function instantiate(): void {
  const calld = getCallDataWrapInitialize()
  setInitializeData(calld)
}

// export function role_changed(): void {
//   const calld = getCallDataWrapRoleChanged()
//   console.log("--role_changed--" + JSON.stringify<RolesChangedHook>(calld))
//   roleChanged(calld);
// }

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.RegisterProviders !== null) {
    result = RegisterProviders(calld.RegisterProviders!);
  } else if (calld.ConnectUser !== null) {
    result = ConnectUser(calld.ConnectUser!);
  } else if (calld.CacheEmail !== null) {
    result = CacheEmail(calld.CacheEmail!);
  } else if (calld.ListenEmail !== null) {
    result = ListenEmail(calld.ListenEmail!);
  } else if (calld.SendEmail !== null) {
    result = SendEmail(calld.SendEmail!);
  } else if (calld.RoleChanged !== null) {
    onlyRole(MODULE_NAME, roles.ROLE_ROLES, "RoleChanged")
    roleChanged(calld.RoleChanged!);
  } else if (calld.HttpRequestHandler !== null) {
    result = HttpRequestHandler(calld.HttpRequestHandler!)
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

function roleChanged(data: RolesChangedHook): void {
  const activ = shouldActivate(data, wasmxw.getAddress())
  if (activ) {
    Initialize(getInitializeData())
  };
}

export function http_request_incoming(): void {
  const calld = getCallDataWrapIncomingRequest()
  const result = HttpRequestHandler(calld)
  wasmx.finish(result);
}
