import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap } from './calldata';
import * as actions from "./actions";
import { revert } from "./utils";
import { onlyInternal } from "wasmx-env/assembly/utils";
import { MODULE_NAME } from "./types";

export function memory_assemblyscript_1(): void {}

export function wasmx_env_i32_2(): void {}

export function wasmx_consensus_json_1(): void {}

export function wasmx_env_core_i32_1(): void {}

export function instantiate(): void {}

export function main(): void {
    let result: ArrayBuffer = new ArrayBuffer(0);

    onlyInternal(MODULE_NAME, "");

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
    } else if (calld.method === "ifBlockNotFinalized") {
        result = actions.wrapGuard(actions.ifBlockNotFinalized(calld.params, calld.event));
        wasmx.finish(result);
        return;
    } else if (calld.method === "ifMajorityLTAlphaThreshold") {
        result = actions.wrapGuard(actions.ifMajorityLTAlphaThreshold(calld.params, calld.event));
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
    } else if (calld.method === "setProposedBlock") {
        actions.setProposedBlock(calld.params, calld.event);
    } else if (calld.method === "changeProposedBlock") {
        actions.changeProposedBlock(calld.params, calld.event);
    } else if (calld.method === "majorityFromRandomSet") {
        actions.majorityFromRandomSet(calld.params, calld.event);
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
        revert(`invalid function call data: ${calld.method}`)
    }
    // we may have set the return data during execution
    result = wasmx.getFinishData();
    wasmx.finish(result);
}
