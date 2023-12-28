import { JSON } from "json-as/assembly";
import { CallRequest, BigInt } from "@ark-us/wasmx-env-2/assembly";
import * as sys from "./sys";
import * as wasmx from "./wasmx";
import { Calldata, BenchmarkParams } from './types'

export function sys_env_1(): void {}
export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  const calldataBz = wasmx.getCallData();
  const calldata = JSON.parse<Calldata>(String.UTF8.decode(calldataBz));
  if (calldata.benchmark != null) {
    const result = benchmark(calldata.benchmark as BenchmarkParams)
    wasmx.finish(result);
  }
}

export function benchmark(args: BenchmarkParams): ArrayBuffer {
    const datastr = JSON.stringify<CallRequest>(args.request);
    const start = sys.timeNow(args.magnitude);
    const valuebz = wasmx.externalCall(String.UTF8.encode(datastr));
    const end = sys.timeNow(args.magnitude);
    const duration = new BigInt(end, false).sub(new BigInt(start, false));
    return duration.toArrayBuffer(false);
}
