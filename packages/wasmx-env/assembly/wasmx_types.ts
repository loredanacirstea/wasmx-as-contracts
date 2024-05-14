import { JSON } from "json-as/assembly";
import { Bech32String, Coin, WasmxExecutionMessage } from "./types";

export const TypeUrl_MsgExecuteContract = "/mythos.wasmx.v1.MsgExecuteContract"

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
