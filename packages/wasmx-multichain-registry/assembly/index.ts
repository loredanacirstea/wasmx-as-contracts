import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import * as base64 from "as-base64/assembly";
import { CallData, CallDataCrossChain, getCallDataCrossChain, getCallDataInitialize, getCallDataWrap } from './calldata';
import { BuildGenAtomicLevelRegistration, ConvertAddressByChainId, CrossChainQuery, CrossChainQueryNonDeterministic, CrossChainTx, GetCurrentLevel, GetSubChainById, GetSubChainConfigById, GetSubChainIds, GetSubChainIdsByLevel, GetSubChainIdsByValidator, GetSubChains, GetSubChainsByIds, GetValidatorAddressesByChainId, GetValidatorsByChainId, InitSubChain, RegisterDefaultSubChain, RegisterDescendantChain, RegisterSubChain, RegisterSubChainValidator, RegisterWithProgenitorChain, RemoveSubChain } from "./actions";
import { LoggerInfo, revert } from "./utils";
import { setParams } from "./storage";
import { WasmxExecutionMessage } from "wasmx-env/assembly/types";

export function wasmx_env_2(): void {}

export function wasmx_crosschain_1(): void {}

export function instantiate(): void {
  const calld = getCallDataInitialize()
  setParams(calld.params);
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.InitSubChain !== null) {
    result = InitSubChain(calld.InitSubChain!);
  } else if (calld.RegisterSubChain !== null) {
    result = RegisterSubChain(calld.RegisterSubChain!);
  } else if (calld.RegisterDefaultSubChain !== null) {
    result = RegisterDefaultSubChain(calld.RegisterDefaultSubChain!);
  } else if (calld.RegisterSubChainValidator !== null) {
    result = RegisterSubChainValidator(calld.RegisterSubChainValidator!);
  } else if (calld.RemoveSubChain !== null) {
    result = RemoveSubChain(calld.RemoveSubChain!);
  } else if (calld.GetSubChainById !== null) {
    result = GetSubChainById(calld.GetSubChainById!);
  } else if (calld.GetSubChainConfigById !== null) {
    result = GetSubChainConfigById(calld.GetSubChainConfigById!);
  } else if (calld.GetSubChainsByIds !== null) {
    result = GetSubChainsByIds(calld.GetSubChainsByIds!);
  } else if (calld.GetSubChains !== null) {
    result = GetSubChains(calld.GetSubChains!);
  } else if (calld.GetSubChainIds !== null) {
    result = GetSubChainIds(calld.GetSubChainIds!);
  } else if (calld.GetSubChainIdsByLevel !== null) {
    result = GetSubChainIdsByLevel(calld.GetSubChainIdsByLevel!);
  } else if (calld.GetSubChainIdsByValidator !== null) {
    result = GetSubChainIdsByValidator(calld.GetSubChainIdsByValidator!);
  } else if (calld.GetValidatorsByChainId !== null) {
    result = GetValidatorsByChainId(calld.GetValidatorsByChainId!);
  } else if (calld.GetValidatorAddressesByChainId !== null) {
    result = GetValidatorAddressesByChainId(calld.GetValidatorAddressesByChainId!);
  } else if (calld.ConvertAddressByChainId !== null) {
    result = ConvertAddressByChainId(calld.ConvertAddressByChainId!);
  } else if (calld.GetCurrentLevel !== null) {
    result = GetCurrentLevel(calld.GetCurrentLevel!);
  } else if (calld.CrossChainTx !== null) {
    result = CrossChainTx(calld.CrossChainTx!);
  } else if (calld.CrossChainQuery !== null) {
    result = CrossChainQuery(calld.CrossChainQuery!);
  } else if (calld.CrossChainQueryNonDeterministic !== null) {
    result = CrossChainQueryNonDeterministic(calld.CrossChainQueryNonDeterministic!);
  } else if (calld.RegisterWithProgenitorChain !== null) {
    result = RegisterWithProgenitorChain(calld.RegisterWithProgenitorChain!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

export function crosschain(): void{
  const calld = getCallDataCrossChain();
  LoggerInfo("crosschain request", ["from_chain_id", calld.from_chain_id, "from", calld.from])

  const calldstr = String.UTF8.decode(base64.decode(calld.msg).buffer)
  const execmsg = JSON.parse<WasmxExecutionMessage>(calldstr);
  const execmsgstr = String.UTF8.decode(base64.decode(execmsg.data).buffer)
  const msg = JSON.parse<CallDataCrossChain>(execmsgstr);
  let result = new ArrayBuffer(0)

  if (msg.RegisterDescendantChain !== null) {
    // only the new chain can send this cross-chain tx
    const chainId = msg.RegisterDescendantChain.data.data.init_chain_request.chain_id
    if (calld.from_chain_id != chainId) {
      revert(`unauthorized: expected ${chainId}, got ${calld.from_chain_id}`);
    }
    // TODO other security rules?
    // check that one of our validators is in the genesis of the new chain?
    result = RegisterDescendantChain(msg.RegisterDescendantChain!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}
