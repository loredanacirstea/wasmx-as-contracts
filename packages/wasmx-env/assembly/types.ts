import { JSON } from "json-as/assembly";

export const MAX_LOGGED = 2000

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

// @ts-ignore
@serializable
export class WasmxLog {
    type: string = 'fsmvm';
    data: Uint8Array;
    topics: Array<Uint8Array>;
    constructor(data: Uint8Array, topics: Array<Uint8Array>) {
        this.data = data;
        this.topics = topics;
    }
}

// @ts-ignore
@serializable
export class GrpcResponse {
    data: string // base64
    error: string
    constructor(data: string, error: string) {
        this.data = data;
        this.error = error;
    }
}

// @ts-ignore
@serializable
export class MerkleSlices {
	slices: string[] // base64 encoded
    constructor(slices: string[]) {
        this.slices = slices;
    }
}

// @ts-ignore
@serializable
export class StartTimeoutRequest {
	contract: string
	delay: i64
	args: Base64String
    constructor(contract: string, delay: i64, args: Base64String) {
        this.contract = contract
        this.delay = delay
        this.args = args
    }
}

// @ts-ignore
@serializable
export class LoggerLog {
	msg: string
	parts: string[]
    constructor(msg: string, parts: string[]) {
        this.msg = msg;
        this.parts = parts;
    }
}
