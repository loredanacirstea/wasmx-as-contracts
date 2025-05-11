import { JSON } from "json-as";
import { Bech32String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "test-crosschain"

@json
export class MsgInitialize {
    crosschain_contract: Bech32String = ""
    constructor(crosschain_contract: Bech32String) {
        this.crosschain_contract = crosschain_contract
    }
}
