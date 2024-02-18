import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgDeposit, MsgEndBlock, MsgSubmitProposal, MsgVote, MsgVoteWeighted, QueryDepositRequest, QueryDepositsRequest, QueryParamsRequest, QueryProposalRequest, QueryProposalsRequest, QueryTallyResultRequest, QueryVoteRequest, QueryVotesRequest } from 'wasmx-gov/assembly/types';
import { MsgInitGenesis, Params, MsgSubmitProposalExtended, MsgAddProposalOption, DepositVote } from "./types"
import { BigInt } from "wasmx-env/assembly/bn";

// @ts-ignore
@serializable
export class MsgEmpty {}

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: MsgInitGenesis | null = null;
    SubmitProposal: MsgSubmitProposal | null = null;
    SubmitProposalExtended: MsgSubmitProposalExtended | null = null;
    AddProposalOption: MsgAddProposalOption | null = null;
    Vote: MsgVote | null = null;
    VoteWeighted: MsgVoteWeighted | null = null;
    Deposit: MsgDeposit | null = null;
    DepositVote: DepositVote | null = null;

    // hooks
    BeginBlock: MsgEmpty | null = null;
    EndBlock: MsgEndBlock | null = null;

    // query
    GetProposal: QueryProposalRequest | null = null;
    GetProposals: QueryProposalsRequest | null = null;
    GetVote: QueryVoteRequest | null = null;
    GetVotes: QueryVotesRequest | null = null;
    GetParams: QueryParamsRequest | null = null;
    GetDeposit: QueryDepositRequest | null = null;
    GetDeposits: QueryDepositsRequest | null = null;
    GetTallyResult: QueryTallyResultRequest | null = null;

}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<CallData>(calldstr);
}

export function getCallDataInitialize(): Params {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    return JSON.parse<Params>(calldstr);
}
