import { JSON } from "json-as/assembly";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { getConfig, addHeader as setHeader } from "./storage";
import { revert } from './utils';

export function addHeader(header: Base64String, validators: Bech32String[], signatures: Base64String[]): void {
    // check chainId correct
    const headerObj = JSON.parse<typestnd.Header>(header);
    const config = getConfig();
    if (config.chainId != headerObj.chain_id) {
        revert(`incorrect chain id: ${headerObj.chain_id}, expected ${config.chainId}`)
    }
    // TODO verify last block hash
    // TODO also save signatures/validators?
    // TODO reward validators & this transaction sender

    setHeader(headerObj);
}
