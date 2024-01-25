import { JSON } from "json-as/assembly";
import * as p2p from "wasmx-p2p/assembly/p2p_wrap";
import * as p2ptypes from "wasmx-p2p/assembly/types";
import { encode as encodeBase64, decode as decodeBase64, encode } from "as-base64/assembly";
import * as wblocks from "wasmx-blocks/assembly/types";
import * as wblockscalld from "wasmx-blocks/assembly/calldata";
import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { LoggerDebug, LoggerInfo, LoggerError, revert } from "./utils";
import {
  Base64String,
  CallRequest,
  CallResponse,
} from 'wasmx-env/assembly/types';
import * as consensuswrap from 'wasmx-consensus/assembly/consensus_wrap';
import * as typestnd from "wasmx-consensus/assembly/types_tendermint";
import { CurrentState, Mempool } from "./types_blockchain";
import * as fsm from 'xstate-fsm-as/assembly/storage';
import {
    EventObject,
    ActionParam,
} from 'xstate-fsm-as/assembly/types';
import { hexToUint8Array, parseInt32, parseInt64, uint8ArrayToHex, i64ToUint8ArrayBE } from "wasmx-utils/assembly/utils";
import { base64ToHex, hex64ToBase64 } from './utils';
import { LogEntry, LogEntryAggregate, TransactionResponse, AppendEntry, AppendEntryResponse, VoteResponse, VoteRequest, NodeUpdate, UpdateNodeResponse } from "./types_raft";
import { getValidators } from "./actions";

export function connectPeers(
    params: ActionParam[],
    event: EventObject,
): void {
    const validators = getValidators();
    const peers: string[] = [];
    for (let i = 0; i < validators.length; i++) {
        const v = validators[i]
        // we compose the multi address
        // /ip4/127.0.0.1/tcp/9002/p2p/12D3KooWQ7pGX1t8RstLQEMZvabqNKibp3NJZtLv73pLXjGiTnPE
        const peer = `/ip4/${v.host}/tcp/${v.port}/p2p/${v.p2p_id}`
        peers.push(peer)
    }
    const req = new p2ptypes.ConnectPeersRequest(peers);
    p2p.ConnectPeers(req);
}

export function sendVoteRequests(
    params: ActionParam[],
    event: EventObject,
): void {
    const termId = getTermId();
    const candidateId = getCurrentNodeId();
    const lastLogIndex = getLastLogIndex();
    const lastEntry = getLastLog();
    const lastLogTerm = lastEntry.termId;

    // iterate through the other nodes and send a VoteRequest
    const request = new VoteRequest(termId, candidateId, lastLogIndex, lastLogTerm);
    const ips = getNodeIPs();
    LoggerInfo("sending vote requests...", ["candidateId", candidateId.toString(), "termId", termId.toString(), "lastLogIndex", lastLogIndex.toString(), "lastLogTerm", lastLogTerm.toString(), "ips", JSON.stringify<Array<string>>(ips)])
    for (let i = 0; i < ips.length; i++) {
        // don't send to ourselves or to removed nodes
        if (candidateId === i || ips[i].length == 0) continue;
        sendVoteRequest(i, ips[i], request, termId);
    }
}

function sendVoteRequest(nodeId: i32, nodeIp: string, request: VoteRequest, termId: i32): void {
    const datastr = JSON.stringify<VoteRequest>(request);
    const signature = signMessage(datastr);

    // const msgstr = `{"run":{"event":{"type":"receiveVoteRequest","params":[{"key":"termId","value":"${request.termId.toString()}"},{"key":"candidateId","value":"${request.candidateId.toString()}"},{"key":"lastLogIndex","value":"${request.lastLogIndex.toString()}"},{"key":"lastLogTerm","value":"${request.lastLogTerm.toString()}"}]}}}`
    const dataBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(datastr)));
    const msgstr = `{"run":{"event":{"type":"receiveVoteRequest","params":[{"key": "entry","value":"${dataBase64}"},{"key": "signature","value":"${signature}"}]}}}`
    const msgBase64 = encodeBase64(Uint8Array.wrap(String.UTF8.encode(msgstr)));

    const contract = wasmx.getAddress();
    LoggerDebug("sending vote request", ["nodeId", nodeId.toString(), "nodeIp", nodeIp, "termId", termId.toString(), "data", datastr])
    const response = wasmxwrap.grpcRequest(nodeIp, Uint8Array.wrap(contract), msgBase64);
    LoggerDebug("vote request response", ["nodeId", nodeId.toString(), "nodeIp", nodeIp, "termId", termId.toString(), "data", response.data, "error", response.error])
    if (response.error.length > 0 || response.data.length == 0) {
        return
    }

    const resp = JSON.parse<VoteResponse>(response.data);
    // if vote granted, add to the votes and check that we have majority
    if (resp.voteGranted) {
        const voteArray = getVoteIndexArray();
        voteArray[nodeId] = 1;
        setVoteIndexArray(voteArray);
    } else {
        // update our termId if we are behind
        if (resp.termId > termId) {
            setTermId(resp.termId);
        }
        // TODO do we need to rollback entries?
    }
}
