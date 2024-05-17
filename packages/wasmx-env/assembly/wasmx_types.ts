import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly";
import { Base64String, Bech32String, Coin, WasmxExecutionMessage } from "./types";

export const TypeUrl_MsgExecuteContract = "/mythos.wasmx.v1.MsgExecuteContract"

// @ts-ignore
@serializable
export class AnyWrap {
    type_url: string = ""
    value: Base64String = ""
    constructor(type_url: string, value: Base64String) {
        this.type_url = type_url
        this.value = value
    }

    static New(typeUrl: string, value: string): AnyWrap {
        return new AnyWrap(typeUrl, base64.encode(Uint8Array.wrap(String.UTF8.encode(value))));
    }
}

// @ts-ignore
@serializable
export class MsgExecuteContract {
    sender: Bech32String
    contract: Bech32String
    msg: WasmxExecutionMessage
    funds: Coin[]
    dependencies: string[]
    constructor(sender: Bech32String, contract: Bech32String, msg: WasmxExecutionMessage, funds: Coin[], dependencies: string[]) {
        this.sender = sender
        this.contract = contract
        this.msg = msg
        this.funds = funds
        this.dependencies = dependencies
    }
    static typeUrl(): string {
        return TypeUrl_MsgExecuteContract;
    }
}
