import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { DoDeposit, InitGenesis, SubmitProposal, DoVote, VoteWeighted } from "./actions";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer;
  const calld = getCallDataWrap();
  if (calld.InitGenesis !== null) {
    result = InitGenesis(calld.InitGenesis!);
  } else if (calld.SubmitProposal !== null) {
    result = SubmitProposal(calld.SubmitProposal!);
  } else if (calld.Vote !== null) {
    result = DoVote(calld.Vote!);
  } else if (calld.VoteWeighted !== null) {
    result = VoteWeighted(calld.VoteWeighted!);
  } else if (calld.Deposit !== null) {
    result = DoDeposit(calld.Deposit!);
  } else {
    wasmx.revert(String.UTF8.encode("invalid function call data"));
    throw new Error("invalid function call data");
  }
  wasmx.finish(result);
}
