import { JSON } from "json-as/assembly";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";

// @ts-ignore
@serializable
export class Config {
    chainId: string;
    constructor(chainId: string) {
        this.chainId = chainId;
    }
}
