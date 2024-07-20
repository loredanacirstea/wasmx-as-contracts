import { JSON } from "json-as/assembly";
import { Bech32String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "simple_storage"

// @ts-ignore
@serializable
export class MsgSet {
    key: string = ""
    value: string = ""
}

// @ts-ignore
@serializable
export class MsgGet {
    key: string = ""
}

// @ts-ignore
@serializable
export class MsgInitialize {
    crosschain_contract: Bech32String = ""
    constructor(crosschain_contract: Bech32String) {
        this.crosschain_contract = crosschain_contract
    }
}
