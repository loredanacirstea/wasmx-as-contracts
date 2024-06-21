import { JSON } from "json-as/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap";
import * as wasmxt from "wasmx-env/assembly/types";
import * as roles from "wasmx-env/assembly/roles";
import * as base64 from "as-base64/assembly"
import * as crosschainw from "wasmx-env/assembly/crosschain_wrap";
import { BigInt } from "wasmx-env/assembly/bn";
import { LoggerInfo, revert } from "./utils";
import { MsgCrossChainCallRequest } from "wasmx-env/assembly/types";
import { MODULE_NAME } from "./types";

export function CrossChain(req: MsgCrossChainCallRequest): ArrayBuffer {
    const resp = crossChainTx(req)
    if (resp.error != "") {
        revert(resp.error);
    }
    return base64.decode(resp.data).buffer
}

export function CrossChainQuery(req: MsgCrossChainCallRequest): ArrayBuffer {
    const resp = crossChainQuery(req)
    if (resp.error != "") {
        revert(resp.error);
    }
    const response = base64.decode(resp.data).buffer
    LoggerInfo("CrossChainQuery", ["response", String.UTF8.decode(response)])
    return response
}

export function crossChainTx(req: wasmxt.MsgCrossChainCallRequest): wasmxt.MsgCrossChainCallResponse {
    const reqstr = JSON.stringify<wasmxt.MsgCrossChainCallRequest>(req)
    const calldatastr = `{"CrossChainTx":${reqstr}}`;
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY, calldatastr, false)
    if (resp.success > 0) {
        revert(`multichain crosschain tx failed: ${resp.data}`)
    }
    return JSON.parse<wasmxt.MsgCrossChainCallResponse>(resp.data)
}


export function crossChainQuery(req: wasmxt.MsgCrossChainCallRequest): wasmxt.MsgCrossChainCallResponse {
    const reqstr = JSON.stringify<wasmxt.MsgCrossChainCallRequest>(req)
    const calldatastr = `{"CrossChainQuery":${reqstr}}`;
    const resp = callContract(roles.ROLE_MULTICHAIN_REGISTRY, calldatastr, true)
    if (resp.success > 0) {
        revert(`multichain crosschain query failed: ${resp.data}`)
    }
    return JSON.parse<wasmxt.MsgCrossChainCallResponse>(resp.data)
}

export function callContract(addr: wasmxt.Bech32String, calldata: string, isQuery: boolean): wasmxt.CallResponse {
    const req = new wasmxt.CallRequest(addr, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(base64.decode(resp.data).buffer);
    return resp;
}
