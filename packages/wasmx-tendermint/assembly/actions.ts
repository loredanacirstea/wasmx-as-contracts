import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';

const ROUND_TIMEOUT = "roundTimeout";

// guards

export function isNextProposer(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return false;
}

export function ifPrevoteThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return false;
}

export function ifPrecommitThreshold(
    params: ActionParam[],
    event: EventObject,
): boolean {
    return false;
}

// actions

export function sendPrevoteResponse(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function sendPrecommitResponse(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function proposeBlock(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function precommitState(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function commit(
    params: ActionParam[],
    event: EventObject,
): void {

}

export function cancelActiveIntervals(
    params: ActionParam[],
    event: EventObject,
): void {

}
