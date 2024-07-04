import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as crosschain from './crosschain';
import { MsgCrossChainCallRequest, MsgCrossChainCallResponse, MsgIsAtomicTxInExecutionRequest, MsgIsAtomicTxInExecutionResponse } from "./types";
import { LoggerDebug } from "./wasmx";

export function executeCrossChainTx(req: MsgCrossChainCallRequest): MsgCrossChainCallResponse {
    const reqdata = JSON.stringify<MsgCrossChainCallRequest>(req)
    const resp = crosschain.executeCrossChainTx(String.UTF8.encode(reqdata));
    return JSON.parse<MsgCrossChainCallResponse>(String.UTF8.decode(resp));
}

export function executeCrossChainQuery(req: MsgCrossChainCallRequest): MsgCrossChainCallResponse {
    const reqdata = JSON.stringify<MsgCrossChainCallRequest>(req)
    const resp = crosschain.executeCrossChainQuery(String.UTF8.encode(reqdata));
    return JSON.parse<MsgCrossChainCallResponse>(String.UTF8.decode(resp));
}

export function executeCrossChainQueryNonDeterministic(req: MsgCrossChainCallRequest): MsgCrossChainCallResponse {
    const reqdata = JSON.stringify<MsgCrossChainCallRequest>(req)
    const resp = crosschain.executeCrossChainQueryNonDeterministic(String.UTF8.encode(reqdata));
    return JSON.parse<MsgCrossChainCallResponse>(String.UTF8.decode(resp));
}

export function executeCrossChainTxNonDeterministic(req: MsgCrossChainCallRequest): MsgCrossChainCallResponse {
    const reqdata = JSON.stringify<MsgCrossChainCallRequest>(req)
    const resp = crosschain.executeCrossChainTxNonDeterministic(String.UTF8.encode(reqdata));
    return JSON.parse<MsgCrossChainCallResponse>(String.UTF8.decode(resp));
}

export function isAtomicTxInExecution(req: MsgIsAtomicTxInExecutionRequest): boolean {
    const reqdata = JSON.stringify<MsgIsAtomicTxInExecutionRequest>(req)
    const resp = crosschain.isAtomicTxInExecution(String.UTF8.encode(reqdata));
    const response = JSON.parse<MsgIsAtomicTxInExecutionResponse>(String.UTF8.decode(resp));
    return response.is_in_execution;
}
