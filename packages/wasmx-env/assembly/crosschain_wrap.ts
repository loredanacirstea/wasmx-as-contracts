import { JSON } from "json-as";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as crosschain from './crosschain';
import { MsgCrossChainCallRequest, MsgCrossChainCallResponse, MsgIsAtomicTxInExecutionRequest, MsgIsAtomicTxInExecutionResponse } from "./types";
import { LoggerDebug } from "./wasmx_wrap";

export function executeCrossChainTx(req: MsgCrossChainCallRequest, moduleName: string = ""): MsgCrossChainCallResponse {
    const reqdata = JSON.stringify<MsgCrossChainCallRequest>(req)
    LoggerDebug(`${moduleName}:wasmx_env_crosschain`, "executeCrossChainTx", ["msg", reqdata])
    const resp = crosschain.executeCrossChainTx(String.UTF8.encode(reqdata));
    LoggerDebug(`${moduleName}:wasmx_env_crosschain`, "executeCrossChainTx", ["msg", reqdata, "response", String.UTF8.decode(resp)])
    return JSON.parse<MsgCrossChainCallResponse>(String.UTF8.decode(resp));
}

export function executeCrossChainQuery(req: MsgCrossChainCallRequest, moduleName: string = ""): MsgCrossChainCallResponse {
    const reqdata = JSON.stringify<MsgCrossChainCallRequest>(req)
    LoggerDebug(`${moduleName}:wasmx_env_crosschain`, "executeCrossChainQuery", ["msg", reqdata])
    const resp = crosschain.executeCrossChainQuery(String.UTF8.encode(reqdata));
    LoggerDebug(`${moduleName}:wasmx_env_crosschain`, "executeCrossChainQuery", ["msg", reqdata, "response", String.UTF8.decode(resp)])
    return JSON.parse<MsgCrossChainCallResponse>(String.UTF8.decode(resp));
}

export function executeCrossChainQueryNonDeterministic(req: MsgCrossChainCallRequest, moduleName: string = ""): MsgCrossChainCallResponse {
    const reqdata = JSON.stringify<MsgCrossChainCallRequest>(req)
    LoggerDebug(`${moduleName}:wasmx_env_crosschain`, "executeCrossChainQueryNonDeterministic", ["msg", reqdata])
    const resp = crosschain.executeCrossChainQueryNonDeterministic(String.UTF8.encode(reqdata));
    LoggerDebug(`${moduleName}:wasmx_env_crosschain`, "executeCrossChainQueryNonDeterministic", ["msg", reqdata, "response", String.UTF8.decode(resp)])
    return JSON.parse<MsgCrossChainCallResponse>(String.UTF8.decode(resp));
}

export function executeCrossChainTxNonDeterministic(req: MsgCrossChainCallRequest, moduleName: string = ""): MsgCrossChainCallResponse {
    const reqdata = JSON.stringify<MsgCrossChainCallRequest>(req)
    LoggerDebug(`${moduleName}:wasmx_env_crosschain`, "executeCrossChainTxNonDeterministic", ["msg", reqdata])
    const resp = crosschain.executeCrossChainTxNonDeterministic(String.UTF8.encode(reqdata));
    LoggerDebug(`${moduleName}:wasmx_env_crosschain`, "executeCrossChainTxNonDeterministic", ["msg", reqdata, "response", String.UTF8.decode(resp)])
    return JSON.parse<MsgCrossChainCallResponse>(String.UTF8.decode(resp));
}

export function isAtomicTxInExecution(req: MsgIsAtomicTxInExecutionRequest, moduleName: string = ""): boolean {
    const reqdata = JSON.stringify<MsgIsAtomicTxInExecutionRequest>(req)
    LoggerDebug(`${moduleName}:wasmx_env_crosschain`, "isAtomicTxInExecution", ["msg", reqdata])
    const resp = crosschain.isAtomicTxInExecution(String.UTF8.encode(reqdata));
    LoggerDebug(`${moduleName}:wasmx_env_crosschain`, "isAtomicTxInExecution", ["msg", reqdata, "response", String.UTF8.decode(resp)])
    const response = JSON.parse<MsgIsAtomicTxInExecutionResponse>(String.UTF8.decode(resp));
    return response.is_in_execution;
}
