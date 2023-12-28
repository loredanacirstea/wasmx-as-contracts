import { fetchSync } from "as-fetch/sync";
import * as wasmx from "./wasmx";
// import { Calldata, BenchmarkParams } from './types'

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  const url = "https://raw.githubusercontent.com/ctzurcanu/ritual/master/dArc/Rouen.md"
  // const resp = fetch(url);
  // console.log(resp);
  // wasmx.finish(result);

  const response = fetchSync(url, {
    method: "GET",
    mode: "no-cors",
    headers: [],
    body: null,
  });
  let body = response.text();
  console.log("Ok: " + response.ok.toString());
  console.log("Status: " + response.status.toString());
  console.log("Status Text: " + response.statusText);
  console.log("Redirected: " + response.redirected.toString());
  console.log("Response: " + body);
  // wasmx.finish(result);
}
