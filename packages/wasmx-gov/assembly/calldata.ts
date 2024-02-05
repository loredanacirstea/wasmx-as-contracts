import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { MsgDeposit, MsgInitGenesis, MsgSubmitProposal, MsgVote, MsgVoteWeighted } from './types';

// @ts-ignore
@serializable
export class CallData {
    InitGenesis: MsgInitGenesis | null = null;
    SubmitProposal: MsgSubmitProposal | null = null;
    Vote: MsgVote | null = null;
    VoteWeighted: MsgVoteWeighted | null = null;
    Deposit: MsgDeposit | null = null;

    // query

}

export function getCallDataWrap(): CallData {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    calldstr = calldstr.replaceAll(`"@type"`, `"anytype"`)
    return JSON.parse<CallData>(calldstr);
}
