import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { EndBlock, DoDeposit, InitGenesis, SubmitProposal, VoteWeighted, GetProposal, GetParams, DoVote } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  // TODO check allowed caller!! is an authority
  // extract this in a common module package

  let result: ArrayBuffer;
  const calld = getCallDataWrap();
  if (calld.EndBlock !== null) {
    result = EndBlock(calld.EndBlock!);
  } else if (calld.SubmitProposal !== null) {
    result = SubmitProposal(calld.SubmitProposal!);
  } else if (calld.VoteWeighted !== null) {
    result = VoteWeighted(calld.VoteWeighted!);
  } else if (calld.Vote !== null) {
    result = DoVote(calld.Vote!);
  } else if (calld.Deposit !== null) {
    result = DoDeposit(calld.Deposit!);
  } else if (calld.GetProposal !== null) {
    result = GetProposal(calld.GetProposal!);
  } else if (calld.GetParams !== null) {
    result = GetParams(calld.GetParams!);
  } else if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else {
    wasmx.revert(String.UTF8.encode("invalid function call data"));
    throw new Error("invalid function call data");
  }
  wasmx.finish(result);
}
