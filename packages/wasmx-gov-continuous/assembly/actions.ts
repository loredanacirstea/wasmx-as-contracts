import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { BigInt } from "wasmx-env/assembly/bn"
import * as banktypes from "wasmx-bank/assembly/types"
import * as erc20types from "wasmx-erc20/assembly/types"
import * as blocktypes from "wasmx-blocks/assembly/types"
import { MsgDeposit, MsgEndBlock, MsgInitGenesis, MsgSubmitProposal, MsgVote, MsgVoteWeighted, QueryDepositRequest, QueryDepositsRequest, QueryParamsRequest, QueryProposalRequest, QueryProposalsRequest, QueryTallyResultRequest, QueryVoteRequest, QueryVotesRequest } from "wasmx-gov/assembly/types";
import { MODULE_NAME } from "./types";
import { LoggerDebug, LoggerInfo, revert } from "./utils";

// TODO this must be in initialization
const DENOM_BASE = "amyt"
const DENOM_STAKE = "asmyt"

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function EndBlock(req: MsgEndBlock): ArrayBuffer {
    return new ArrayBuffer(0)
}

/// tx

export function SubmitProposal(req: MsgSubmitProposal): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function DoVote(req: MsgVote): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function VoteWeighted(req: MsgVoteWeighted): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function DoDeposit(req: MsgDeposit): ArrayBuffer {
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
