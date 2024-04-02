import { JSON } from "json-as/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import { Params, ValidatorSigningInfo} from "./types";
import { ConsensusAddressString } from "wasmx-env/assembly/types";
import { base64ToString } from "wasmx-utils/assembly/utils";

const PARAM_KEY = "params"
// address => ValidatorSigningInfo
const VALIDATOR_SIGNING_INFO_KEY = "validatorSigningInfo_";

export function getValidatorSigningInfoKey(addr: ConsensusAddressString): string {
    return VALIDATOR_SIGNING_INFO_KEY + addr;
}

export function getValidatorSigningInfos(): ValidatorSigningInfo[] {
    const startKey = getValidatorSigningInfoKey("");
    const values = wasmxw.sloadRangeStringKeys(startKey, "", false);
    const msgs: ValidatorSigningInfo[] = [];
    for (let i = 0; i < values.length; i++) {
        const msgstr = base64ToString(values[i])
        const msg = JSON.parse<ValidatorSigningInfo>(msgstr)
        msgs.push(msg);
    }
    return msgs
}


export function getValidatorSigningInfo(addr: ConsensusAddressString): ValidatorSigningInfo | null {
    const value = wasmxw.sload(getValidatorSigningInfoKey(addr));
    if (value == "") return null;
    return JSON.parse<ValidatorSigningInfo>(value);
}

export function setValidatorSigningInfo(addr: ConsensusAddressString, signingInfo: ValidatorSigningInfo): void {
    wasmxw.sstore(getValidatorSigningInfoKey(addr), JSON.stringify<ValidatorSigningInfo>(signingInfo));
}

export function getParams(): Params {
    const value = wasmxw.sload(PARAM_KEY);
    return JSON.parse<Params>(value);
}

export function getParamsInternal(): string {
    return wasmxw.sload(PARAM_KEY);
}

export function setParams(params: Params): void {
    return wasmxw.sstore(PARAM_KEY, JSON.stringify<Params>(params));
}
