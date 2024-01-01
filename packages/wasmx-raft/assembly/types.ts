import { JSON } from "json-as/assembly";

export type HexString = string;
export type Base64String = string;
export type Bech32String = string;

// @ts-ignore
@serializable
export class CallRequest {
  to: string;
  calldata: string;
  value: i64;
  gasLimit: i64;
  isQuery: boolean;
  constructor(to: string, calldata: string, value: i64, gasLimit: i64, isQuery: boolean) {
    this.to = to;
    this.calldata = calldata;
    this.value = value;
    this.gasLimit = gasLimit;
    this.isQuery = isQuery;
  }
}

// @ts-ignore
@serializable
export class CallResponse {
  success: i32;
  data: string;
  constructor(success: i32, data: string) {
    this.success = success;
    this.data = data;
  }
}

