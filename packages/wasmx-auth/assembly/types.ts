import { JSON } from "json-as/assembly";
import { Base64String, Bech32String, Coin } from 'wasmx-env/assembly/types';
import { BigInt } from "wasmx-env/assembly/bn"

export const MODULE_NAME = "auth"

// @ts-ignore
@serializable
export class MsgInitGenesis {
    constructor() {

    }
}
