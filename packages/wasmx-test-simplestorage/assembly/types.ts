import { JSON } from "json-as";
import { Bech32String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "simple_storage"

@json
export class MsgSet {
    key: string = ""
    value: string = ""
}

@json
export class MsgGet {
    key: string = ""
}

@json
export class MsgInitialize {
    crosschain_contract: Bech32String = ""
    constructor(crosschain_contract: Bech32String) {
        this.crosschain_contract = crosschain_contract
    }
}
