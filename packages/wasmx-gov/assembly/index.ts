import { JSON } from "json-as";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, getCallDataWrap } from './calldata';
import { EndBlock, DoDeposit, InitGenesis, SubmitProposal, VoteWeighted, GetProposal, GetParams, DoVote, GetProposals, GetTallyResult } from "./actions";
import { revert } from "./utils";
import { onlyInternal } from "wasmx-env/assembly/utils";
import { MODULE_NAME } from "./types";

export function wasmx_env_2(): void {}

export function instantiate(): void {}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();

  // public operations
  if (calld.SubmitProposal !== null) {
    result = SubmitProposal(calld.SubmitProposal!);
  } else if (calld.VoteWeighted !== null) {
    result = VoteWeighted(calld.VoteWeighted!);
  } else if (calld.Vote !== null) {
    result = DoVote(calld.Vote!);
  } else if (calld.Deposit !== null) {
    result = DoDeposit(calld.Deposit!);
  } else if (calld.GetProposal !== null) {
    result = GetProposal(calld.GetProposal!);
  } else if (calld.GetProposals !== null) {
    result = GetProposals(calld.GetProposals!);
  } else if (calld.GetTallyResult !== null) {
    result = GetTallyResult(calld.GetTallyResult!);
  } else if (calld.GetParams !== null) {
    result = GetParams(calld.GetParams!);
  }

  // internal operations
  else if (calld.EndBlock !== null) {
    onlyInternal(MODULE_NAME, "EndBlock");
    result = EndBlock(calld.EndBlock!);
  } else if (calld.InitGenesis !== null) {
    onlyInternal(MODULE_NAME, "InitGenesis");
    result = InitGenesis(calld.InitGenesis!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
