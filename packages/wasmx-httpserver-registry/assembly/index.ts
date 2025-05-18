import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { stringToBase64 } from "wasmx-utils/assembly/utils";
import { getCallDataWrap } from './calldata';
import { revert } from "./utils";
import { SetRoute } from "./actions";
import { HttpResponse, HttpResponseWrap } from "wasmx-env-httpclient/assembly/types";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function wasmx_httpserver_1(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.SetRoute !== null) {
    result = SetRoute(calld.SetRoute!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

export function http_request_incoming(): void {
  const headers = new Map<string,string[]>();
  headers.set("Content-Type", ["application/json"])
  const resp = new HttpResponseWrap("", new HttpResponse(
    "200 OK",
    200,
    0,
    false,
    headers,
    stringToBase64(`{"a":1}`),
  ))
  const result = String.UTF8.encode(JSON.stringify<HttpResponseWrap>(resp))
  wasmx.finish(result);
}
