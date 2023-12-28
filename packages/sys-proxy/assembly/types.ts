import { JSON } from "json-as/assembly";
import { CallRequest } from "@ark-us/wasmx-env-2/assembly";

// @ts-ignore
@serializable
export class Calldata {
  benchmark!: BenchmarkParams | null;
}

// @ts-ignore
@serializable
export class BenchmarkParams {
  request!: CallRequest;
  magnitude: i32 = 0; // 0 = seconds ; 9 = nanoseconds
}
