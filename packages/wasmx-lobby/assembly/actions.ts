import { JSON } from "json-as/assembly";
import { ActionParam, EventObject } from "xstate-fsm-as/assembly/types";

export function wrapGuard(value: boolean): ArrayBuffer {
    if (value) return String.UTF8.encode("1");
    return String.UTF8.encode("0");
}

export function ifWaitingForValidators(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return false
}

export function sendNewChainResponse() {

}

export function receiveNewChainResponse() {
    // if we receve other validators than we chose,
    // we alphabetically order & them & select 3 (or our min-validator number)
    // check validators.length == signatures.length
    // each signature is on all validators
}
