import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { GetParams } from "wasmx-gov/assembly/actions";
import { CallData, getCallDataInitialize, getCallDataWrap } from './calldata';
import { EndBlock, DoDeposit, InitGenesis, SubmitProposal, VoteWeighted, GetProposal, DoVote, SubmitProposalExtended, AddProposalOption, DoDepositVote, GetProposals, GetTallyResult } from "./actions";
import { revert } from "./utils";
import { Params } from "./types";
import { setParams } from "./storage";

export function wasmx_env_2(): void {}

export function instantiate(): void {
  const params = getCallDataInitialize();
  setParams(params)
}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.EndBlock !== null) {
    result = EndBlock(calld.EndBlock!);
  } else if (calld.SubmitProposal !== null) {
    result = SubmitProposal(calld.SubmitProposal!);
  } else if (calld.SubmitProposalExtended !== null) {
    result = SubmitProposalExtended(calld.SubmitProposalExtended!);
  } else if (calld.AddProposalOption !== null) {
    result = AddProposalOption(calld.AddProposalOption!);
  } else if (calld.VoteWeighted !== null) {
    result = VoteWeighted(calld.VoteWeighted!);
  } else if (calld.Vote !== null) {
    result = DoVote(calld.Vote!);
  } else if (calld.Deposit !== null) {
    result = DoDeposit(calld.Deposit!);
  } else if (calld.DepositVote !== null) {
    result = DoDepositVote(calld.DepositVote!);
  } else if (calld.GetProposal !== null) {
    result = GetProposal(calld.GetProposal!);
  } else if (calld.GetProposals !== null) {
    result = GetProposals(calld.GetProposals!);
  } else if (calld.GetTallyResult !== null) {
    result = GetTallyResult(calld.GetTallyResult!);
  } else if (calld.GetParams !== null) {
    result = GetParams(calld.GetParams!);
  } else if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
