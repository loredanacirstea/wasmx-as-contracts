import { JSON } from "json-as/assembly";
import {
  eventual as _eventual,
  instantiate as _instantiate,
  runInternal,
  MachineExternal,
  setup,
} from './machine';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { getCallDataWrap, getInterpreterCalldata } from './calldata';
import { arrayBufferToU8Array } from 'wasmx-utils/assembly/utils';
import {
  EventObject,
  TimerArgs,
} from './types';
import {
  getCurrentState,
  getContextValueInternal,
} from './storage';
import { revert } from './utils';

export function wasmx_env_2(): void {}
export function wasmx_consensus_json_1(): void {}

export function instantiate(): void {}

export function main(): u8[] {
    let result: ArrayBuffer = new ArrayBuffer(0);
    const icalld = getCallDataWrap();
    const calldata = icalld.calldata;
    const config = icalld.config;
    if (calldata.run !== null) {
      const event = calldata.run!.event;
      const _event = new EventObject(event.type, event.params);
      runInternal(config, _event);
      // we may have set the return data during execution
      result = wasmx.getFinishData();
    } else if (calldata.instantiate !== null) {
      const calld = calldata.instantiate!;
      _instantiate(config, calld.initialState, calld.context);
      result = new ArrayBuffer(0)
    } else if (calldata.getCurrentState !== null) {
      const state = getCurrentState();
      result = String.UTF8.encode(state.value);
    } else if (calldata.getContextValue !== null) {
      result = getContextValueInternal(calldata.getContextValue!.key);
    } else if (calldata.setup !== null) {
      setup(config, calldata.setup!);
      result = new ArrayBuffer(0);
    } else {
      revert("invalid function call data");
      return arrayBufferToU8Array(new ArrayBuffer(0));
    }
    wasmx.finish(result);
    return arrayBufferToU8Array(result);
}

export function eventual(): void {
  const icalld = getInterpreterCalldata();
  const configBz = icalld[0];
  const calld = icalld[1];
  const config = JSON.parse<MachineExternal>(String.UTF8.decode(configBz));
  const argsStr = String.UTF8.decode(calld);
  console.debug("* eventual: args: " + argsStr);
  const _args = JSON.parse<TimerArgs>(argsStr);
  _eventual(config, _args);
}
