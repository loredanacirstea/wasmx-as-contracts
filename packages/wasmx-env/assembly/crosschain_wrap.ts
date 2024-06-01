import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as crosschain from './crosschain';
import { MsgExecuteCrossChainTxRequest, MsgExecuteCrossChainTxResponse } from "./types";
import { LoggerDebug } from "./wasmx";

export function executeCrossChainTx(req: MsgExecuteCrossChainTxRequest): MsgExecuteCrossChainTxResponse {
    const reqdata = JSON.stringify<MsgExecuteCrossChainTxRequest>(req)
    const resp = crosschain.executeCrossChainTx(String.UTF8.encode(reqdata));
    return JSON.parse<MsgExecuteCrossChainTxResponse>(String.UTF8.decode(resp));
}
