import { JSON } from "json-as";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";

@json
export class Config {
    chainId: string;
    constructor(chainId: string) {
        this.chainId = chainId;
    }
}
