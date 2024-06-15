import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as crosschain from './crosschain';
import { MsgCrossChainCallRequest, MsgCrossChainCallResponse } from "./types";
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
