import { JSON } from "json-as/assembly";
import * as base64 from "as-base64/assembly"
import * as crosschainw from "wasmx-env/assembly/crosschain_wrap";
import { MsgExecuteCrossChainTxRequest } from "wasmx-env/assembly/types";
import { revert } from "./utils";

export function CrossChain(req: MsgExecuteCrossChainTxRequest): ArrayBuffer {
    const resp = crosschainw.executeCrossChainTx(req)
    if (resp.error != "") {
        revert(resp.error);
    }
    return base64.decode(resp.data).buffer
}
