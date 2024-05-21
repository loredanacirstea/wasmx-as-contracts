import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import { CallRequest, CallResponse, Base64String, Bech32String } from "wasmx-env/assembly/types";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import {
  EventObject,
  InterpreterStatus,
  StateMachine,
  HandledActions,
  UnsubscribeReturnValue,
  ActionObject,
  State,
  States,
  StateInfo,
  ActionParam,
  ContextParam,
  StateInfoClassExternal,
  RaiseActionType,
  TimerArgs,
  AssignAction,
  Transition,
  ExternalActionCallData,
  MODULE_NAME,
} from './types';
import { getAddressHex, parseInt32, parseInt64 } from 'wasmx-utils/assembly/utils';
import * as storage from './storage';
import * as actionsCounter from "./actions_counter";
import * as actionsErc20 from "./actions_erc20";
import { INIT_EVENT, ASSIGN_ACTION, REVERT_IF_UNEXPECTED_STATE, WILDCARD, VARIABLE_SYMBOL } from './config';
import {
  getLastIntervalId,
  setLastIntervalId,
  registerIntervalId,
  cancelActiveIntervals,
  isRegisteredIntervalActive,
  removeInterval,
} from './timer';
import { LoggerDebug, revert, ctxToActionParams, LoggerError, LoggerInfo } from "./utils";
import { BigInt } from "wasmx-env/assembly/bn";

export function instantiate(
  config: MachineExternal,
  initialState: string,
  params: ContextParam[],
): void {
  storage.storeContextParams(params);
  storage.setCurrentStatus(InterpreterStatus.NotStarted);
  storage.storeOwner(wasmx.getCaller());

  // TODO see if there are initial actions to perform (e.g. entry actions)
  // const stateConfig = findStateInfo(service.machine.states, initialState);
  const iniactions:  ActionObject[] = [];
  const res = handleActions(
    iniactions,
    INIT_EVENT as EventObject
  );
  const initialActions = res.actions;
  if (initialState.at(0) != "#") {
    initialState = `#${config.id}.${initialState}`
  }
  const newstate = new State(initialState, initialActions, false, "");
  storage.setCurrentState(newstate);

  const service = new ServiceExternal(config , InterpreterStatus.NotStarted).toInternal();
  // TODO start endpoint?
  service.start();
}

function createUnchangedState(value: string, prevState: string): State {
  return new State(value, [], false, prevState);
  // matches: createMatcher(value)
}

function handleActions(
  actions: Array<ActionObject>,
  eventObject: EventObject
): HandledActions {
  let assigned = false;
  const nonAssignActions: ActionObject[] = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    if (action.type === ASSIGN_ACTION) {
      assigned = true;

      // const aassign = action.assignment;

      // // TODO
      // if (action.assignmentFn) {
      //   // tmpContext = action.assignmentFn(nextContext, eventObject);
      // } else if (aassign) {
      //   const keys = aassign.keys();
      //   for (let i = 0; i < keys.length; i++) {
      //     const key = keys[i];
      //     const value = aassign.get(key);
      //     tmpContext.set(key, value);
      //   }
      //   // aassign.keys().forEach((key: string) => {
      //     // const value = typeof assign.get(key) === 'function'
      //     //     ? assign.get(key)(nextContext, eventObject)
      //     //     : assign.get(key);
      //   //   const value = aassign.get(key);
      //   //   tmpContext.set(key, value);
      //   // });
      // }

      // return false;
      continue;
    }
    // return true;
    nonAssignActions.push(action);
  }
  // console.log("--handleActions--nextContext-" + nextContext.keys().join(","))

  // return {actions: nonAssignActions, ctx: nextContext, assigned};
  return new HandledActions(nonAssignActions, assigned);
}

function executeGuard(
    machine: StateMachine.Machine,
    guard: ActionObject | null,
    event: EventObject,
): boolean {
    if (guard == null) return true;
    LoggerDebug("execute guard", ["guard", guard.type]);

    if (guard.type === "isAdmin") return isAdmin([]);
    if (guard.type === "ifIntervalActive") return ifIntervalActive([], event);
    if (guard.type === "hasEnoughBalance") return actionsErc20.hasEnoughBalance([], event);
    if (guard.type === "hasEnoughAllowance") return actionsErc20.hasEnoughAllowance([], event);

    // If guard is not a local function, then it is an external function
    let guardParams = guard.params.concat(ctxToActionParams(machine.ctx))
    const resp = processExternalCall(machine, guard.type, guardParams, event);
    LoggerDebug("execute guard", ["guard", guard.type, "success", (resp.data == "1").toString()]);
    if (resp.success > 0) return false;
    // "1" = true ; "0" = false
    if (resp.data == "1") return true;

    return false;
}

function executeStateActions(
    service: Service,
    state: State,
    event: EventObject,
): void {
  console.debug("* executeStateActions: " + state.actions.length.toString())
  for (let i = 0; i < state.actions.length; i++) {
    const action = state.actions[i];
    executeStateAction(service, state, event, action);
  }

  // if it is a targetless (internal) transition, we do not run after/always
  if (!state.changed) {
    return;
  }
  console.debug("* executeStateActions after actions for: " + state.value)

  // timed actions from the new target state
  const newstateconfig = findStateInfo(service.machine.states, state.value);
  if (!newstateconfig) {
    return revert("could not find state config for " + state.value);
  }

  // run the current state after transitions
  const afterTimers = newstateconfig.after;
  if (afterTimers != null) {
    runAfterTransitions(state.value, afterTimers.keys());
  }

  // run the current state always
  if (newstateconfig.always.length > 0) {
    const newstate = applyTransitions(service.machine, state, newstateconfig.always, new EventObject("", []), 0)
    if (newstate != null) {
      // Set new state before executing actions
      storage.setCurrentState(newstate);
      executeStateActions(service, newstate, new EventObject("", []));
    }
  }
}

function runAfterTransitions(statePath: string, delayKeys: string[]): void {
  console.debug("* setting timed actions for " + statePath);
  console.debug("* setting timed actions... " + delayKeys.join(","));

  for (let i = 0; i < delayKeys.length; i++) {
    // delay is in milliseconds
    let delay = u64(0);
    const delayKey = parseInt(delayKeys[i], 10);
    if (Number.isNaN(delayKey)) {
      // This should be a context variable
      const value = storage.getContextValue(delayKeys[i]);
      if (!value) {
        return revert("delay key not found in context: " + delayKeys[i]);
      }
      delay = u64(parseInt(value, 10));
    } else {
      delay = u64(delayKey);
    }
    const intervalId = getLastIntervalId() + 1;
    setLastIntervalId(intervalId);
    registerIntervalId(statePath, delayKeys[i], intervalId);

    let contractAddress = "";

    // TODO - do we allow contract calls to other contracts?
    // const meta = afterTimers.get(delayKeys[i]).meta;
    // if (meta.length > 0) {
    //   for (let i = 0; i < meta.length; i++) {
    //     if (meta[i].key == "contract") {
    //       contractAddress = meta[i].value;
    //       break;
    //     }
    //   }
    // }
    if (contractAddress == "") {
      contractAddress = wasmxw.addr_humanize(wasmx.getAddress());
    }
    const args = new TimerArgs(delayKeys[i], statePath, intervalId);
    const argsStr = JSON.stringify<TimerArgs>(args);
    LoggerDebug("starting timeout", ["intervalId", intervalId.toString()]);
    wasmxw.startTimeout(contractAddress, delay, argsStr);
  }
}

function applyTransitions(
  machine: StateMachine.Machine,
  state: State,
  transitions: Transition[],
  event: EventObject,
  ifElse: i32, // 0 = normal transition; 2 > = if/else
): State | null {
  if (transitions.length == 0) return null;
  if (transitions.length > 1 && ifElse == 0) {
    ifElse = transitions.length;
  }
  if (ifElse > 1) {
    if (transitions.length == ifElse) {
      LoggerDebug(`apply if`, ["target", transitions[0].target]);
    } else {
      LoggerDebug(`apply else`, ["target", transitions[0].target]);
    }
  }
  const newstate = machine.applyTransition(state, transitions[0], event);
  if (newstate != null) return newstate;
  transitions.shift();
  return applyTransitions(machine, state, transitions, event, ifElse);
}

function executeStateAction(
    service: Service,
    state: State,
    event: EventObject,
    action:  ActionObject,
): void {
    const actionType = action.type;
    console.debug("* execute action: " + actionType);

    if (actionType === RaiseActionType) {
        const ev = action.event;
        console.debug("* raise: " + ev!.type);
        if (ev === null) {
            return revert("raise action is missing event");
        }
        const _event: EventObject = new EventObject(ev.type, ev.params);
        service.send(_event);
        return;
    }
    const actionParams = action.params;
    for (let i = 0; i < actionParams.length; i++) {
      if (actionParams[i].value.length > 0 && actionParams[i].value.at(0) == VARIABLE_SYMBOL) {
        const varname = actionParams[i].value.slice(1);
        let value: string = ""
        // first look into event parameters
        for (let i = 0; i < event.params.length; i++) {
          if (event.params[i].key == varname) {
            value = event.params[i].value;
            break;
          }
        }

        // then look into the temporary context
        if (value == "" && service.machine.ctx.has(varname)) {
          value = service.machine.ctx.get(varname);
        }

        // then look into storage
        if (value == "") {
          value = storage.getContextValue(varname);
        }
        actionParams[i].value = value;
      }
    }
    if (actionType === "assign") {
      assign(service.machine, actionParams, event);
      return;
    }
    if (actionType === "sendRequest") {
      sendRequest(actionParams, event);
      return;
    }
    if (actionType === "log") {
        log(actionParams);
        return
    }
    if (actionType === "noaction") {
      noaction(actionParams, event);
      return;
    }
    if (actionType === "cancelActiveIntervals") {
      cancelActiveIntervals(state, actionParams, event);
      return;
    }
    if (actionType === "mint") {
      actionsErc20.mint(actionParams, event);
      return;
    }
    if (actionType === "move") {
        actionsErc20.move(actionParams, event);
        return;
    }
    if (actionType === "approve") {
        actionsErc20.approve(actionParams, event);
        return;
    }
    if (actionType === "logTransfer") {
        actionsErc20.logTransfer(actionParams, event);
        return;
    }
    if (actionType === "increment") {
      actionsCounter.increment(actionParams);
      return;
    }

    // If action is not a local action, then it is an external action
    const resp = processExternalCall(service.machine, action.type, actionParams, event);
    if (resp.success > 0) {
      return revert("action failed: " + actionType + "; err=" + resp.data);
    }
    if (resp.data.length > 0) {
      wasmx.setFinishData(String.UTF8.encode(resp.data));
    }
}

function noaction(
  params: ActionParam[],
  event: EventObject,
): void {}

function assign(
  machine: StateMachine.Machine,
  params: ActionParam[],
  event: EventObject,
): void {
  for (let i = 0; i < params.length; i++) {
    machine.ctx.set(params[i].key, params[i].value);
  }
}

function processExternalCall(
    machine: StateMachine.Machine,
    actionType:  string,
    params: ActionParam[],
    event: EventObject,
): CallResponse {
  let contractAddress: string = "";
  // actions can have `label.function`
  // where label refers to an address saved in the context
  if (actionType.includes(".")) {
    const parts = actionType.split(".")
    if (parts.length < 2) {
      return new CallResponse(1, "cannot find contract address by label");
    }
    // contract label => contractAddress
    contractAddress = storage.getContextValue(parts[0]);
    actionType = parts[1];
  } else {
    // use library contract address
    contractAddress = machine.library;
  }

  if (contractAddress === "") {
    return new CallResponse(1, "empty contract address");
  }
  const calldata = new ExternalActionCallData(actionType, params, event);
  const calldatastr = JSON.stringify<ExternalActionCallData>(calldata);
  const req = new CallRequest(contractAddress, calldatastr, BigInt.zero(), 10000000, false);
  const resp = wasmxw.call(req, MODULE_NAME);
  resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
  return resp;
}

function isAdmin(
  params: ActionParam[],
): boolean {
  const caller = wasmx.getCaller();
  const owner = storage.loadOwner();
  return getAddressHex(caller) === getAddressHex(owner);
}

function log(
  params: ActionParam[],
): void {
  for (let i = 0; i < params.length; i++) {
    const key = params[i].key;
    const message = params[i].value;
    const value = storage.getContextValue(key);
    console.log(`${key}: ${value} - ${message}`);
  }
}

function sendRequest(
  params: ActionParam[],
  event: EventObject,
): void {
  let address: string = "";
  let data: string = "";
  for (let i = 0; i < event.params.length; i++) {
      if (event.params[i].key === "address") {
          address = event.params[i].value;
          continue;
      }
      if (event.params[i].key === "data") {
          data = event.params[i].value;
          continue;
      }
  }
  if (address === "") {
      revert("sendRequest empty IP address");
  }
  if (data === "") {
      revert("sendRequest empty data");
  }
  const contract = wasmx.getCaller();
  wasmxw.grpcRequest(address, Uint8Array.wrap(contract), data);
}

export class Service implements StateMachine.Service {
  machine: StateMachine.Machine
  status: InterpreterStatus
  listeners: Set<StateMachine.StateListener>

  constructor(
    machine: StateMachine.Machine,
    status: InterpreterStatus,
  ) {
    this.machine = machine;
    this.status = status;
    this.listeners = new Set<StateMachine.StateListener>();
  }

  send(event: EventObject): void {
    console.debug("* send event: " + event.type);
    console.debug("* status: " + this.status.toString());
    if (this.status !== InterpreterStatus.Running) {
      return;
    }
    let state = storage.getCurrentState();
    const newstate = this.machine.transition(state, event);
    if (newstate == null) {
      return;
    }
    console.debug("* posttransition state: " + newstate.value);
    // Set new state before executing actions
    storage.setCurrentState(newstate);
    executeStateActions(this, newstate, event);

    const listeners = this.listeners.values();
    for (let i = 0; i < listeners.length; i++) {
      listeners[i](newstate);
    }
  }

  subscribe(listener: StateMachine.StateListener): UnsubscribeReturnValue {
    this.listeners.add(listener);
    let state = storage.getCurrentState();
    listener(state);

    return {
      unsubscribe: () => this.listeners.delete(listener)
    };
  }

  start(): Service {
    this.status = InterpreterStatus.Running;
    storage.setCurrentStatus(InterpreterStatus.Running)
    let state = storage.getCurrentState();
    executeStateActions(this, state, INIT_EVENT);
    this.send(INIT_EVENT);
    return this;
  }

  stop(): Service {
    this.status = InterpreterStatus.Stopped;
    storage.setCurrentStatus(InterpreterStatus.Stopped)
    this.listeners.clear();
    return this;
  }
}

// @ts-ignore
@serializable
export class ServiceExternal {
  machine: MachineExternal
  status: InterpreterStatus
  // TODO listeners can be addresses that should be announced about state changes

  constructor(
    machine: MachineExternal,
    status: InterpreterStatus,
  ) {
    this.machine = machine;
    this.status = status;
  }

  static fromInternal(service: Service): ServiceExternal {
    const machine = MachineExternal.fromInternal(service.machine);
    const status = service.status;
    return new ServiceExternal(machine, status);
  }

  toInternal(): Service {
    const machine = this.machine.toInternal();
    const status = this.status;
    return new Service(machine, status);
  }
}

export class Machine implements StateMachine.Machine {
  id: string;
  library: Bech32String;
  states: States;
  ctx: Map<string,string>;

  constructor(
    id: string,
    library: Bech32String,
    states: States,
    ctx: Map<string,string>,
  ) {
    this.id = id;
    this.library = library;
    this.states = states;
    this.ctx = ctx;
  }

  transition(
    state: State,
    eventObject: EventObject
  ): State | null {
    const value = state.value;
    const stateConfig = findStateInfo(this.states, value);
    if (!stateConfig) {
        const message = "state not found: " + value;
        wasmx.revert(String.UTF8.encode(message));
        throw new Error(message);
    }
    let transitions: Transition[] | null = null;

    if (stateConfig.on) {
      if (stateConfig.on.has(eventObject.type)) {
        transitions = stateConfig.on.get(eventObject.type);
      } else {
        // search for transition in the parents
        transitions = findTransitionInParents(this.states, value, eventObject);

        if (transitions == null) {
          const message = `cannot apply "${eventObject.type}" event in current "${value}" state`;
          if (REVERT_IF_UNEXPECTED_STATE) {
            wasmx.revert(String.UTF8.encode(message));
            throw new Error(message);
          } else {
            LoggerInfo("cannot apply event in current state", ["event", eventObject.type, "state", value]);
            return null;
          }

        }
      }
    }

    if (transitions !== null) {
      return applyTransitions(this, state, transitions, eventObject, 0)
    }

    // No transitions match
    return createUnchangedState(value, state.previousValue);
  }

  applyTransition(
    state: State,
    transition: Transition,
    eventObject: EventObject,
  ): State | null {
    LoggerDebug("applyTransition: ", ["from", state.value, "to", transition.target]);
    const value = state.value;
    const stateConfig = findStateInfo(this.states, value);
    if (!stateConfig) {
        const message = "state not found: " + value;
        wasmx.revert(String.UTF8.encode(message));
        throw new Error(message);
    }

    const transitions: Array<Transition> = [transition];

    if (stateConfig.on.has(WILDCARD)) {
      const _trans = stateConfig.on.get(WILDCARD);
      // TODO is this correct?
      return applyTransitions(this, state, _trans, eventObject, 0)
      // transitions.push(_trans);
      // for (let i = 0; i < _trans.length; i++) {
      //   transitions.push(_trans[i]);
      // }
    }

    for (let i = 0; i < transitions.length; i++) {
      const transition = transitions[i];
        if (transition === null) {
          return createUnchangedState(value, state.previousValue);
        }
        const target = transition.target;
        const actions = transition.actions || [];
        const guard = transition.guard;

        const isTargetless = target === null || target === "";

        let nextStateValue = target;
        if (isTargetless) {
          nextStateValue = value;
        }

        const nextStateConfig = findStateInfo(this.states, nextStateValue);
        // console.log("--findStateInfo--END=nextStateConfig-")
        if (!nextStateConfig) {
            const message = "state not found: " + nextStateValue;
            wasmx.revert(String.UTF8.encode(message));
            throw new Error(message);
        }

      if (guard != null && !executeGuard(this, guard, eventObject)) {
        const message = "cannot execute transition; guard: " + guard.type;
        if (REVERT_IF_UNEXPECTED_STATE) {
          wasmx.revert(String.UTF8.encode(message));
          throw new Error(message);
        } else {
          LoggerDebug(message, []);
          return null;
        }
    }

      // if (cond(eventObject)) {
      if (true) {
        let allActions: ActionObject[] = [];

        // state exit actions
        if (!isTargetless) {
          allActions = allActions.concat(processActions(stateConfig.exit, eventObject));
        }
        // event actions
        allActions = allActions.concat(processActions(actions, eventObject));
        // state entry actions
        if (!isTargetless) {
          allActions = allActions.concat(processActions(nextStateConfig.entry, eventObject));
        }

        // for (let i = 0; i < allActions.length; i++) {
        //   const action = allActions[i];
        //   const actionFn = action.actionFn;
        //   if (actionFn) {
        //     const obj = toActionObject(actionFn, this.options.actions);
        //     allActionObjects.push(obj);
        //   }
        //   const obj = toActionObjectFromString(action.value, this.options.actions);
        //   allActionObjects.push(obj);
        // }

        let resolvedTarget = target;
        if (isTargetless) {
          resolvedTarget = value;
        }

         // child states! we choose the first one
        const stateConfigResolved = findStateInfo(this.states, resolvedTarget);
        // console.log("--findStateInfo--END=");
        if (!stateConfigResolved) {
          const message = "state not found: " + resolvedTarget;
          wasmx.revert(String.UTF8.encode(message));
          throw new Error(message);
        }
        // console.log("--findStateInfo--END1=");
        if (stateConfigResolved.states !== null && stateConfigResolved.states.keys().length > 0) {
          // state has children
          // initial key
          let initialState = stateConfigResolved.states.keys()[0];
          const initialStateObj = stateConfigResolved.states.get(initialState);
          if (initialState.at(0) != "#") {
            initialState = `${resolvedTarget}.${initialState}`
          }
          resolvedTarget = initialState;

          // add the action of this child state
          allActions = allActions.concat(processActions(initialStateObj.entry, eventObject));

          // we run any "after" transitions on the parent
          const afterTimersParent = nextStateConfig.after;
          if (afterTimersParent != null) {
            runAfterTransitions(target, afterTimersParent.keys());
          }
        }

        console.debug("* transition next target: " + resolvedTarget);



        console.debug(`allActions.length: ` + allActions.length.toString())

        const res = handleActions(
          // allActionObjects,
          allActions,
          eventObject
        );
        const nonAssignActions = res.actions;
        const assigned = res.assigned;

        return new State(resolvedTarget, nonAssignActions, !isTargetless, state.value);
        // matches: createMatcher(resolvedTarget)
      }
    }

    // No transitions match
    return createUnchangedState(value, state.previousValue);
  }
}

function processActions(actions: ActionObject[], event: EventObject): ActionObject[] {
  let allActions: ActionObject[] = [];
  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    if (act.type === RaiseActionType) {
        // We are looking through parameters of the current event
        // and adding them in the raised event if the key values match
        // TODO - another way?
        // console.log("--raise?0-" + act.type);
        if (act.event === null) {
            const message = "raise action is missing event";
            wasmx.revert(String.UTF8.encode(message));
            throw new Error(message);
        }
        // console.log("--raise?1-" + act.event!.type);
        // console.log("--raise?11-" + act.event!.params.length.toString());
        for (let k = 0; k < act.event!.params.length; k++) {
            const key = act.event!.params[k].key;
            const value = act.event!.params[k].value;
            // console.log("--raise?2-param-" + key + "--" + value);
            let found = false;
            if (value.includes("()")) {
                // TODO have a map with all provided functions and guards
                if (value === "getCaller()") {
                    act.event!.params[k].value = getAddressHex(wasmx.getCaller());
                    found = true;
                }
            } else {
                for (let x = 0; x < event.params.length; x++) {
                    if (event.params[x].key === value) {
                        act.event!.params[k].value = event.params[x].value;
                        found = true;
                    }
                }
                const v = storage.getContextValue(value);
                if (!found && v) {
                  // look in context
                  act.event!.params[k].value = v;
                }
            }
        }
    }
    // console.log("--raise add action!-" + act.type);
    allActions.push(act);
  }
  return allActions;
}


// @ts-ignore
@serializable
export class MachineExternal {
  id: string;
  library: Bech32String;
  states: Array<StateInfoClassExternal>;

  constructor(
    id: string,
    library: Bech32String,
    states: Array<StateInfoClassExternal>,
  ) {
    this.id = id;
    this.library = library;
    this.states = states;
  }

  static fromInternal(configInternal: StateMachine.Machine): MachineExternal {
    const states = StateInfoClassExternal.fromInternalStatesMap(configInternal.states);

    return new MachineExternal(
      configInternal.id,
      configInternal.library,
      states,
    );
  }

  toInternal(): Machine {
    const states = StateInfoClassExternal.toInternalFromArray(this.states);
    return new Machine(
        this.id,
        this.library,
        states,
        new Map<string,string>(),
    );
  }
}

export function runInternal(config: MachineExternal, event: EventObject): ArrayBuffer {
    const service = loadServiceFromConfig(config);
    service.send(event);
    return new ArrayBuffer(0);
}

export function executeInternal(config: MachineExternal, event: EventObject, action: ActionObject): ArrayBuffer {
  const service = loadServiceFromConfig(config);
  let state = storage.getCurrentState();
  executeStateAction(service, state, event, action);
  return new ArrayBuffer(0);
}

export function loadServiceFromConfig(config: MachineExternal): Service {
    const status = storage.getCurrentStatus();
    return new ServiceExternal(config, status).toInternal();
}

function findTransitionInParents(states: States, stateName: string, eventObject: EventObject): Transition[] | null {
  // all state values must be absolute
  if (stateName.at(0) != "#") {
    revert("state must be absolute: " + stateName);
    return null;
  }
  let statePath = stateName.substring(1).split(".").slice(1);
  statePath.pop(); // remove current kid
  return findTransitionInternal(states, statePath, eventObject)
}

function findTransitionInternal(states: States, statePath: string[], eventObject: EventObject): Transition[] | null {
  const stateConfig = findStateInfoByPath(states, statePath);
  if (stateConfig != null && stateConfig.on.has(eventObject.type)) {
    return stateConfig.on.get(eventObject.type);
  }
  if (statePath.length == 0) {
    return null;
  }
  statePath.pop(); // remove current kid
  return findTransitionInternal(states, statePath, eventObject);
}

// TODO: nested state names as paths unlocked.active.
export function findStateInfo(
    states: States,
    stateName: string,
): StateInfo | null {
    if (stateName.at(0) === "#") {
        // "#ERC20.unlocked.active"
        // TODO support multiple machines
        const statePath = stateName.substring(1).split(".").slice(1)
        return findStateInfoByPath(states, statePath)
    }
    // TODO here, we should only look in the current state, not the machine states
    const keys = states.keys();
    // console.log("--findStateInfo--" + stateName + "---" + keys.join(","));
    for (let i = 0; i < keys.length; i++) {
        // console.log("--findStateInfo--" + keys[i]);
        const stateinfo = states.get(keys[i]);
        if (keys[i] === stateName) return stateinfo;
        if (stateinfo.states && stateinfo.states.keys().length > 0) {
            const info = findStateInfo(stateinfo.states, stateName);
            if (info !== null) return info;
        }
    }
    return null;
}

export function findStateInfoByPath(
    states: States,
    statePath: string[],
): StateInfo | null {
    let currentStates = states;
    let state: StateInfo | null = null;
    // console.log("--findStateInfoByPath--" + statePath.join("."));
    for (let k = 0; k < statePath.length; k++) {
        const currentStateName = statePath[k];
        state = currentStates.get(currentStateName);
        if (k < (statePath.length - 1)) {
            if (!state.states || state.states.keys().length === 0) {
                revert("findStateInfoByPath: state does not have childstates: " + statePath.join("."));
            }
            currentStates = state.states;
        }
    }
    return state;
}

// we only use absolute paths for states
export function equalStateOrIncluded(state1: string, state2: string): boolean {
  if (state1 == state2) return true;
  if (state1.includes(state2)) return true;
  if (state2.includes(state1)) return true;
  return false;
}

export function eventual(config: MachineExternal, args: TimerArgs): void {
  const active = isRegisteredIntervalActive(args.state, args.delay, args.intervalId);
  LoggerDebug("eventual", ["state", args.state, "delay", args.delay, "intervalId", args.intervalId.toString(), "active", active.toString()]);
  if (!active) {
    return;
  }

  // deactivate interval
  removeInterval(args.state, args.delay, args.intervalId);

  const service = loadServiceFromConfig(config);
  const currentState = storage.getCurrentState();
  LoggerDebug("eventual", ["current state", currentState.value]);

  const newstateconfig = findStateInfo(service.machine.states, args.state);
  if (!newstateconfig) {
    return revert("could not find state config for " + args.state);
  }

  const isEqual = equalStateOrIncluded(currentState.value, args.state);

  const afterTimers = newstateconfig.after;
  if (afterTimers == null || !afterTimers.has(args.delay)) {
    // we are in the wrong state, so the interval must be stopped
    return;
  }

  // delay is in milliseconds
  const transitions = afterTimers.get(args.delay);
  if (!transitions) {
    revert("delayed transition not found: " + args.delay);
  }

  let validTransitions = transitions;
  // we may have forced transitions to execute
  // even if the current state does not match the eventual state
  if (!isEqual) {
    validTransitions = [];
    for (let i = 0; i < transitions.length; i++) {
      if (transitions[i].meta.length > 0 && transitions[i].meta[0].key == "force") {
        validTransitions.push(transitions[i]);
      }
    }
    if (validTransitions.length == 0) {
      // we are in the wrong state, so the interval must be stopped
      LoggerDebug("eventual: we are in the wrong state", []);
      return;
    }
  }
  if (validTransitions.length == 0) {
    return;
  }

  LoggerDebug("eventual: execute delayed action", ["delay", args.delay]);

  LoggerInfo("eventual", ["state", args.state, "delay", args.delay, "intervalId", args.intervalId.toString(), "current_state", currentState.value]);

  // just a copied transition
  let state = storage.getCurrentState();
  // we add the interval id in the event
  let intervalIdField = new ActionParam("intervalId", args.intervalId.toString())
  let stateField = new ActionParam("state", args.state)
  let delayField = new ActionParam("delay", args.delay)
  let emptyEvent = new EventObject("", [intervalIdField, stateField, delayField]);
  const newstate = applyTransitions(service.machine, state, validTransitions, emptyEvent, 0);
  if (newstate == null) {
    return;
  }
  // Set new state before executing actions
  storage.setCurrentState(newstate);
  executeStateActions(service, newstate, emptyEvent);
  // TODO listeners?
}

export function setup(config: MachineExternal, contractAddress: string): void {
  if (config.library == "") {
    return revert("could not execute setup: fsm does not have a library");
  }
  // const calldata = `{"setup":"${contractAddress}"}`
  const param = new ActionParam("previousAddress", contractAddress);
  const calldata = new ExternalActionCallData("setup", [param], new EventObject("",[]));
  const calldatastr = JSON.stringify<ExternalActionCallData>(calldata);
  const req = new CallRequest(config.library, calldatastr, BigInt.zero(), 10000000, false);
  const resp = wasmxw.call(req, MODULE_NAME);
  if (resp.success > 0) {
    return revert("could not execute setup");
  }
}

// we dont need this; eventual removes the interval data before guard is ran
function ifIntervalActive(
  params: ActionParam[],
  event: EventObject,
): boolean {
  if (params.length == 0) {
    params = event.params;
  }
  let intervalIdStr = "";
  let state = "";
  let delay = "";
  for (let i = 0; i < params.length; i++) {
    if (params[i].key === "intervalId") {
      intervalIdStr = params[i].value;
        continue;
    }
    if (params[i].key === "state") {
      state = params[i].value;
        continue;
    }
    if (params[i].key === "delay") {
      delay = params[i].value;
        continue;
    }
  }
  if (intervalIdStr === "") {
      revert("no intervalId found");
  }
  if (state === "") {
      revert("no state found");
  }
  if (delay === "") {
      revert("no delay found");
  }
  const intervalId = parseInt64(intervalIdStr);
  const active = isRegisteredIntervalActive(state, delay, intervalId);
  LoggerDebug("ifIntervalActive", ["intervalId", intervalIdStr, "active", active.toString()])

  // remove the interval data
  removeInterval(state, delay, intervalId);
  return active;
}
