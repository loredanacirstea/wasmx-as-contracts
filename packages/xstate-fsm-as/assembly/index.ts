import { JSON } from "json-as";
import {
  eventual as _eventual,
  instantiate as _instantiate,
  runInternal,
  MachineExternal,
  setup,
  executeInternal,
} from './machine';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallData, CallDataRun, getCallDataWrap, getInterpreterCalldata } from './calldata';
import { arrayBufferToU8Array, base64ToString } from 'wasmx-utils/assembly/utils';
import {
  ActionParam,
  EventObject,
  MODULE_NAME,
  TimerArgs,
} from './types';
import {
  getCurrentState,
  getContextValueInternal,
} from './storage';
import { LoggerDebug, LoggerInfo, revert } from './utils';
import { Base64String } from "wasmx-env/assembly/types";

export function memory_assemblyscript_1(): void {}

export function wasmx_env_i32_2(): void {}

export function wasmx_env_core_i32_1(): void {}

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
    } else if (calldata.StartNode !== null) {
      StartNodeInternal(config)
      result = new ArrayBuffer(0);
    } else if (calldata.SetupNode !== null) {
      SetupNodeInternal(config, calldata.SetupNode!.data)
      result = new ArrayBuffer(0);
    } else if (calldata.execute !== null) {
      const action = calldata.execute!.action;
      const _event = new EventObject("", []);
      executeInternal(config, _event, action);
      // we may have set the return data during execution
      result = wasmx.getFinishData();
    } else {
      const calldraw = wasmx.getCallData();
      let calldstr = String.UTF8.decode(calldraw)
      revert(`invalid function call data: ${calldstr}`);
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

// forward StartNode hook to "start" event
export function StartNode(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const icalld = getInterpreterCalldata();
  const configBz = icalld[0];
  const config = JSON.parse<MachineExternal>(String.UTF8.decode(configBz));
  StartNodeInternal(config)
  // we may have set the return data during execution
  result = wasmx.getFinishData();
  wasmx.finish(result);
}

// forward SetupNode hook to "setupNode" event
export function SetupNode(): void {
  let result: ArrayBuffer = new ArrayBuffer(0);
  const icalld = getInterpreterCalldata();
  const configBz = icalld[0];
  const calld = icalld[1];
  const argsStr = String.UTF8.decode(calld);
  const config = JSON.parse<MachineExternal>(String.UTF8.decode(configBz));
  SetupNodeInternal(config, argsStr)
  // we may have set the return data during execution
  result = wasmx.getFinishData();
  wasmx.finish(result);
}

export function SetupNodeInternal(config: MachineExternal, calld: Base64String): void {
  LoggerInfo("emit setupNode event", ["module", MODULE_NAME])
  const _event = new EventObject("setupNode", [new ActionParam("data", calld)]);
  runInternal(config, _event);
}

export function StartNodeInternal(config: MachineExternal): void {
  LoggerInfo("emit start event", ["module", MODULE_NAME])
  const _event = new EventObject("start", []);
  runInternal(config, _event);
}

// TODO forward p2p received messages to the p2p endpoint of the contract library
export function p2pmsg(): void {
  const icalld = getInterpreterCalldata();
  const configBz = icalld[0];
  const calldBz = icalld[1];
  const config = JSON.parse<MachineExternal>(String.UTF8.decode(configBz));
  const p2pmsg = JSON.parse<P2PMessage>(String.UTF8.decode(calldBz));

  LoggerDebug("p2pmsg", ["room", p2pmsg.roomId, "sender_id", p2pmsg.sender.id, "sender_ip", p2pmsg.sender.ip])

  const calldata = JSON.parse<CallData>(base64ToString(p2pmsg.message))

  let result: ArrayBuffer = new ArrayBuffer(0);
  const event = calldata.run!.event;
  const _event = new EventObject(event.type, event.params);
  runInternal(config, _event);
  // we may have set the return data during execution
  result = wasmx.getFinishData();
}

@json
export class NetworkNode {
  id: Base64String // p2p id
  host: string
  port: string
  ip: string // can be empty if host & port are used
  constructor(id: Base64String, host: string, port: string, ip: string) {
    this.id = id
    this.host = host
    this.port = port
    this.ip = ip
  }
}

@json
export class P2PMessage {
    roomId: string
    message:   Base64String
    timestamp: Date
	  sender: NetworkNode
    constructor(roomId: string, message: string, timestamp: Date, sender: NetworkNode) {
        this.roomId = roomId
        this.message = message
        this.timestamp = timestamp
        this.sender = sender
    }
}
