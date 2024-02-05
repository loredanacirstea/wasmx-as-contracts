import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { BigInt } from "wasmx-env/assembly/bn"
import { MsgDeposit, MsgInitGenesis, MsgSubmitProposal, MsgVote, MsgVoteWeighted, QueryDepositRequest, QueryDepositsRequest, QueryParamsRequest, QueryProposalRequest, QueryProposalsRequest, QueryTallyResultRequest, QueryVoteRequest, QueryVotesRequest } from "./types";

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    return new ArrayBuffer(0)
}

/// tx

export function SubmitProposal(req: MsgSubmitProposal): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function Vote(req: MsgVote): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function VoteWeighted(req: MsgVoteWeighted): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function Deposit(req: MsgDeposit): ArrayBuffer {
    return new ArrayBuffer(0)
}

/// queries

export function GetProposal(req: QueryProposalRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetProposals(req: QueryProposalsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetVote(req: QueryVoteRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetVotes(req: QueryVotesRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetParams(req: QueryParamsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetDeposit(req: QueryDepositRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetDeposits(req: QueryDepositsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetTallyResult(req: QueryTallyResultRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}
