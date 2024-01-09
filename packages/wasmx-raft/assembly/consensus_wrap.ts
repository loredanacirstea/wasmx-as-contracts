import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64, decode } from "as-base64/assembly";
import * as consensus from './consensus';
import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import {
    ResponseWrap,
    RequestInitChain,
    RequestPrepareProposal,
    RequestProcessProposal,
    RequestFinalizeBlock,
    ResponseInitChain,
    ResponsePrepareProposal,
    ResponseProcessProposal,
    ResponseFinalizeBlock,
    ResponseFinalizeBlockWrap,
    ResponseCommit,
    RequestCheckTx,
    ResponseCheckTx,
} from './types_tendermint';

export function CheckTx(req: RequestCheckTx): ResponseCheckTx {
    const reqstr = JSON.stringify<RequestCheckTx>(req);
    wasmxwrap.LoggerDebug("CheckTx", ["request", reqstr]);
    const respbz = consensus.CheckTx(String.UTF8.encode(reqstr));
    const respstr = String.UTF8.decode(respbz);
    wasmxwrap.LoggerDebug("CheckTx", ["response", respstr]);
    return JSON.parse<ResponseCheckTx>(respstr);
}

export function PrepareProposal(req: RequestPrepareProposal): ResponsePrepareProposal {
    const reqstr = JSON.stringify<RequestPrepareProposal>(req);
    wasmxwrap.LoggerDebug("PrepareProposal", ["request", reqstr]);
    const respbz = consensus.PrepareProposal(String.UTF8.encode(reqstr));
    const respstr = String.UTF8.decode(respbz);
    wasmxwrap.LoggerDebug("PrepareProposal", ["response", respstr]);
    return JSON.parse<ResponsePrepareProposal>(respstr);
}

export function ProcessProposal(req: RequestProcessProposal): ResponseProcessProposal {
    const reqstr = JSON.stringify<RequestProcessProposal>(req);
    wasmxwrap.LoggerDebug("ProcessProposal", ["request", reqstr]);
    const respbz = consensus.ProcessProposal(String.UTF8.encode(reqstr));
    const respstr = String.UTF8.decode(respbz);
    wasmxwrap.LoggerDebug("ProcessProposal", ["response", respstr]);
    return JSON.parse<ResponseProcessProposal>(respstr);
}

export function FinalizeBlock(req: RequestFinalizeBlock): ResponseFinalizeBlockWrap {
    const reqstr = JSON.stringify<RequestFinalizeBlock>(req);
    wasmxwrap.LoggerDebug("FinalizeBlock", ["request", reqstr]);
    const respbz = consensus.FinalizeBlock(String.UTF8.encode(reqstr));
    const respstr = String.UTF8.decode(respbz);
    wasmxwrap.LoggerDebug("FinalizeBlock", ["response", respstr]);
    const wrap = JSON.parse<ResponseWrap>(respstr);
    const response = new ResponseFinalizeBlockWrap(wrap.error, null);
    if (wrap.error.length == 0) {
        const data = String.UTF8.decode(decodeBase64(wrap.data).buffer)
        wasmxwrap.LoggerDebug("FinalizeBlock", ["response data", data]);
        response.data = JSON.parse<ResponseFinalizeBlock>(data);
    }
    return response;
}

export function Commit(): ResponseCommit {
    wasmxwrap.LoggerDebug("Commit", []);
    const respbz = consensus.Commit();
    const respstr = String.UTF8.decode(respbz);
    wasmxwrap.LoggerDebug("Commit", ["response", respstr]);
    return JSON.parse<ResponseCommit>(respstr);
}

export function RollbackToVersion(height: i64): string {
    wasmxwrap.LoggerDebug("RollbackToVersion", []);
    const respbz = consensus.RollbackToVersion(height);
    const errstr = String.UTF8.decode(respbz);
    wasmxwrap.LoggerDebug("RollbackToVersion", ["err", errstr]);
    return errstr;
}
