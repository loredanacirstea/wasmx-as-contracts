import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as crosschain from './crosschain';
import { MsgExecuteCrossChainTxRequest, MsgExecuteCrossChainTxResponse } from "./types";

export function executeCrossChainTx(req: MsgExecuteCrossChainTxRequest): MsgExecuteCrossChainTxResponse {
    const resp = crosschain.executeCrossChainTx(String.UTF8.encode(JSON.stringify<MsgExecuteCrossChainTxRequest>(req)));
    return JSON.parse<MsgExecuteCrossChainTxResponse>(String.UTF8.decode(resp));
}
