import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import * as actions from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
    let result: ArrayBuffer = new ArrayBuffer(0);
    const calld = getCallDataWrap();
    if (calld.method === "ifMajorityConfidenceGTCurrent") {
        result = actions.wrapGuard(actions.ifMajorityConfidenceGTCurrent(calld.params, calld.event));
        wasmx.finish(result);
        return;
    } else if (calld.method === "ifIncrementedCounterLTBetaThreshold") {
        result = actions.wrapGuard(actions.ifIncrementedCounterLTBetaThreshold(calld.params, calld.event));
        wasmx.finish(result);
        return;
    } else if (calld.method === "ifMajorityIsOther") {
        result = actions.wrapGuard(actions.ifMajorityIsOther(calld.params, calld.event));
        wasmx.finish(result);
        return;
    } else if (calld.method === "incrementRoundsCounter") {
        actions.incrementRoundsCounter(calld.params, calld.event);
    } else if (calld.method === "resetRoundsCounter") {
        actions.resetRoundsCounter(calld.params, calld.event);
    } else if (calld.method === "resetConfidences") {
        actions.resetConfidences(calld.params, calld.event);
    } else if (calld.method === "sendResponse") {
        actions.sendResponse(calld.params, calld.event);
    } else if (calld.method === "proposeBlock") {
        actions.proposeBlock(calld.params, calld.event);
    } else if (calld.method === "setProposedHash") {
        actions.setProposedHash(calld.params, calld.event);
    } else if (calld.method === "changeProposedHash") {
        actions.changeProposedHash(calld.params, calld.event);
    } else if (calld.method === "sendQueryToRandomSet") {
        actions.sendQueryToRandomSet(calld.params, calld.event);
    } else if (calld.method === "incrementConfidence") {
        actions.incrementConfidence(calld.params, calld.event);
    } else if (calld.method === "finalizeBlock") {
        actions.finalizeBlock(calld.params, calld.event);
    } else if (calld.method === "setupNode") {
        actions.setupNode(calld.params, calld.event);
    } else if (calld.method === "setup") {
        actions.setup(calld.params, calld.event);
    }
    else {
        wasmx.revert(String.UTF8.encode("invalid function call data"));
        throw new Error("invalid function call data");
    }
    // we may have set the return data during execution
    result = wasmx.getFinishData();
    wasmx.finish(result);
}
