import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as roles from "wasmx-env/assembly/roles";
import { RolesChangedHook } from "wasmx-roles/assembly/types";
import { shouldActivate } from "wasmx-roles/assembly/sdk";
import { onlyRole } from "wasmx-env/assembly/utils";
import { getCallDataWrap, getCallDataWrapIncomingRequest } from './calldata';
import { revert } from "./utils";
import { Close, defaultResponse, GetRoute, GetRoutes, HttpRequestHandler, Initialize, RemoveRoute, SetRoute, StartWebServer } from "./actions";
import { MODULE_NAME } from "./types";

export function wasmx_env_2(): void {}
export function wasmx_httpserver_1(): void {}
export function wasmx_sql_1(): void {}
export function wasmx_oauth2client_1(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.SetRoute !== null) {
    result = SetRoute(calld.SetRoute!);
  } else if (calld.GetRoute !== null) {
    result = GetRoute(calld.GetRoute!);
  } else if (calld.GetRoutes !== null) {
    result = GetRoutes(calld.GetRoutes!);
  } else if (calld.HttpRequestHandler !== null) {
    result = defaultResponse();
  } else if (calld.RemoveRoute !== null) {
    result = RemoveRoute(calld.RemoveRoute!);
  } else if (calld.StartWebServer !== null) {
    result = StartWebServer(calld.StartWebServer!);
  } else if (calld.Close !== null) {
    result = Close();
  } else if (calld.RoleChanged !== null) {
    onlyRole(MODULE_NAME, roles.ROLE_ROLES, "RoleChanged")
    roleChanged(calld.RoleChanged!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

export function http_request_incoming(): void {
  const calld = getCallDataWrapIncomingRequest()
  const result = HttpRequestHandler(calld)
  wasmx.finish(result);
}

function roleChanged(data: RolesChangedHook): void {
  const activ = shouldActivate(data, wasmxw.getAddress())
  if (activ) {
    Initialize()
  };
}
