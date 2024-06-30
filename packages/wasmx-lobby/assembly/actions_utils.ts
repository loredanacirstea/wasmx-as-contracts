import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as cfg from "./config";
import { Base64String } from "wasmx-env/assembly/types";
import { PotentialValidator, PotentialValidatorWithSignature } from "./types";

export function signMessage(validator_privkey: string, msgstr: string): Base64String {
    return wasmxw.ed25519Sign(validator_privkey, msgstr);
}

export function getProtocolId(chainId: string): string {
    return cfg.PROTOCOL_ID + "_" + chainId
}

export function getTopic(chainId: string, topic: string): string {
    return topic + "_" + chainId
}

export function wrapValidators(validators: PotentialValidator[], signatures: string[]): PotentialValidatorWithSignature[] {
    const v = new Array<PotentialValidatorWithSignature>(validators.length)
    for (let i = 0; i < validators.length; i++) {
       v[i] = new PotentialValidatorWithSignature(validators[i], signatures[i])
    }
    return v;
}

export function sortValidators(validators: PotentialValidatorWithSignature[]): PotentialValidatorWithSignature[] {
    return validators.sort((a: PotentialValidatorWithSignature, b: PotentialValidatorWithSignature): i32 => {
      return a.validator.addressBytes < b.validator.addressBytes ? -1 : a.validator.addressBytes > b.validator.addressBytes ? 1 : 0;
    });
}

export function sortValidatorsSimple(validators: PotentialValidator[]): PotentialValidator[] {
    return validators.sort((a: PotentialValidator, b: PotentialValidator): i32 => {
      return a.addressBytes < b.addressBytes ? -1 : a.addressBytes > b.addressBytes ? 1 : 0;
    });
}

export function mergeValidators(validators: PotentialValidatorWithSignature[], validators2: PotentialValidatorWithSignature[]): PotentialValidatorWithSignature[] {
    const m = new Map<string,bool>()
    for (let i = 0; i < validators.length; i++) {
        m.set(validators[i].validator.addressBytes, true)
    }
    for (let i = 0; i < validators2.length; i++) {
        if (m.has(validators2[i].validator.addressBytes)) {
            continue;
        }
        validators.push(validators2[i])
        m.set(validators2[i].validator.addressBytes, true)
    }
    return validators;
}
