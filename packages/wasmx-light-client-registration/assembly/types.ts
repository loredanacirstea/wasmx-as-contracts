import { JSON } from "json-as/assembly";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";

// @ts-ignore
@serializable
export class Chains {
    chainsIds: string[];
    constructor(chainsIds: string[]) {
        this.chainsIds = chainsIds;
    }
}

// @ts-ignore
@serializable
export class Config {
    min_validators: i32;
    constructor(min_validators: i32) {
        this.min_validators = min_validators;
    }
}

// @ts-ignore
@serializable
export class ChainInfo {
    validators: Bech32String[];
    lightClient: Bech32String;
    constructor(validators: Bech32String[], lightClient: Bech32String) {
        this.validators = validators;
        this.lightClient = lightClient;
    }
}

// @ts-ignore
@serializable
export class MsgHeader {
    chainId: string;
    header: Base64String;
    constructor(chainId: string, header: Base64String) {
        this.chainId = chainId;
        this.header = header;
    }
}
