import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataInitialize, getCallDataWrap } from './calldata';
import { revert } from "./utils";
import { setChainIds, setLastNodePorts } from "./storage";
import * as actions from "./actions";
import { HookCalld } from "wasmx-env/assembly/hooks";

export function wasmx_env_2(): void {}

export function wasmx_multichain_1(): void {}

export function wasmx_crosschain_1(): void {}

export function instantiate(): void {
  const calld = getCallDataInitialize()
  setChainIds(calld.ids);
  setLastNodePorts(calld.initialPorts)
}

export function main(): void {
  let result: ArrayBuffer = new ArrayBuffer(0)
  const calld = getCallDataWrap();
  if (calld.AddSubChainId !== null) {
    result = actions.addSubChainId(calld.AddSubChainId!);
  } else if (calld.SetInitialPorts !== null) {
    result = actions.setInitialPorts(calld.SetInitialPorts!);
  } else if (calld.GetSubChainIds !== null) {
    result = actions.getSubChainIds(calld.GetSubChainIds!);
  } else if (calld.GetNodePortsPerChainId !== null) {
    result = actions.getNodePortsPerChainId(calld.GetNodePortsPerChainId!);
  } else if (calld.GetSubChainIdsWithPorts !== null) {
    result = actions.getSubChainIdsWithPorts(calld.GetSubChainIdsWithPorts!);
  } else if (calld.StartNode !== null) {
    actions.StartNode();
  } else if (calld.NewSubChain !== null) {
    actions.NewSubChain(calld.NewSubChain!)
    result = new ArrayBuffer(0);
  } else if (calld.StartStateSync !== null) {
    actions.StartStateSync(calld.StartStateSync!);
  } else {
    const calldraw = wasmx.getCallData();
    let calldstr = String.UTF8.decode(calldraw)
    revert(`invalid function call data: ${calldstr}`);
  }
  wasmx.finish(result);
}

export function NewSubChain(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const calldraw = wasmx.getCallData();
  let calldstr = String.UTF8.decode(calldraw)
  const calld = JSON.parse<HookCalld>(calldstr);
  actions.NewSubChain(calld)
  // we may have set the return data during execution
  result = wasmx.getFinishData();
  wasmx.finish(result);
}
