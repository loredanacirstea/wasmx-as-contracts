import { JSON } from "json-as";
import { Base64String, Bech32String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "fsm"

export enum InterpreterStatus {
  NotStarted = 0,
  Running = 1,
  Stopped = 2
}

export var StatusMap = new Map<string, InterpreterStatus>();
StatusMap.set("0", InterpreterStatus.NotStarted);
StatusMap.set("1", InterpreterStatus.Running);
StatusMap.set("2", InterpreterStatus.Stopped);

@json
export class EventObject {
  type: string;
  params: ActionParam[];

  constructor(type: string, params: ActionParam[]) {
    this.type = type;
    this.params = params;
  }
}

export type ContextGeneral<T> =  Map<string,T>
export type ContextGeneralString =  Map<string,string>

export type StateInfoEvents = Map<string,Transition[]>

export type StateTimers = Map<string,Transition[]>

export interface StateInfo {
  always: Array<Transition>;
  after: StateTimers | null;
  on: StateInfoEvents;
  exit: Array<ActionObject>;
  entry: Array<ActionObject>;
  initial: string;
  states: States;
}

export type States = Map<string,StateInfo>

export type ActionFunction = (event: EventObject) => void;
// we dont use this. we use the "assign" action
export type AssignAction = 'xstate.assign';

export namespace StateMachine {
  export interface Machine {
    id: string;
    library: Bech32String;
    states: States;
    ctx: Map<string,string>;
    transition(
      state: State,
      event: EventObject
    ): State | null;
    applyTransition(
      state: State,
      transition: Transition,
      event: EventObject,
    ): State | null;
  }

  export type StateListener = (state: State) => void;

  export interface Service {
    send(event: EventObject): void;
    subscribe(listener: StateListener): UnsubscribeReturnValue;
    start(): Service;
    stop (): Service;
    readonly status: InterpreterStatus;
  }

  // export type Assigner = (
  //   context: TContext,
  //   event: EventObject
  // ) => Partial<TContext>;

  export type PropertyAssigner = Map<string, string>

  export type PropertyAssignerFnMap = Map<string,((context: ContextGeneralString, event: EventObject) => string)>

  export type PropertyAssignerFn = ((context: ContextGeneralString, event: EventObject) => string)
}

export interface Typestate {
  value: string;
  context: ContextGeneralString;
}

// export type ExtractEvent<
//   TEvent extends EventObject,
//   TEventType extends string
// > = TEvent extends { type: TEventType } ? TEvent : never;

export class HandledActions {
  actions: Array<ActionObject> = [];
  assigned: boolean = false;

  constructor(
    actions: Array<ActionObject>,
    assigned: boolean
  ) {
    this.actions = actions;
    this.assigned = assigned;
  }
}

export interface UnsubscribeReturnValue {
  unsubscribe: () => void;
}

@json
export class ActionParam {
  key: string;
  value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }
}

@json
export class ActionObject {
  type: string;
  params: Array<ActionParam>
  event: EventObject | null = null
  // exec: ActionFunction | null;
  // assignment: PropertyAssigner<ContextGeneralString> | null;
  // assignmentFn: PropertyAssignerFn | null;
  // properties: Map<string,string>

  constructor(type: string, params: Array<ActionParam>, event: EventObject | null) {
    this.type = type;
    this.params = params;
    this.event = event;
  }
}

export const RaiseActionType = "xstate.raise";

@json
export class RaiseAction extends ActionObject{
  type: string = RaiseActionType;
  params: Array<ActionParam> = [];
  event: EventObject;

  constructor(type: string, params: Array<ActionParam>, event: EventObject) {
    super(type, params, null);
    this.event = event;
  }
}

export class State {
  value: string;
  actions: Array<ActionObject>;
  changed: boolean;
  previousValue: string;

  constructor(
    value: string,
    actions: Array<ActionObject>,
    changed: boolean,
    previousValue: string,
  ) {
    this.value = value;
    this.actions = actions;
    this.changed = changed;
    this.previousValue = previousValue;
  }
}

@json
export class StateClassExternal {
  value: string;
  actions: Array<ActionObject>;
  changed: boolean;
  previousValue: string;

  constructor(
    value: string,
    actions: Array<ActionObject>,
    changed: boolean,
    previousValue: string,
  ) {
    this.value = value;
    this.actions = actions;
    this.changed = changed;
    this.previousValue = previousValue
  }

  toInternal(): State {
    const stateactions: Array<ActionObject> = [];
    for (let i = 0; i < this.actions.length; i++) {
        const act = this.actions[i];
        stateactions.push(new ActionObject(act.type, act.params, act.event));
    }
    return new State(this.value, stateactions, this.changed, this.previousValue);
  }

  static fromInternal(state: State): StateClassExternal {
    const iniactions: Array<ActionObject> = [];
    for (let i = 0; i < state.actions.length; i++) {
        const act = state.actions[i];
        iniactions.push(new ActionObject(act.type, act.params, act.event));
    }

    return new StateClassExternal(
        state.value,
        iniactions,
        state.changed,
        state.previousValue,
    );
  }
}

@json
export class AssignActionObject extends ActionObject {
  type: AssignAction;
   // assignment: PropertyAssigner<ContextGeneralString> | null;
  assignment: Map<string, string> | null = null;
  // assignmentFn: PropertyAssignerFn | null;
  assignmentFn: ((event: EventObject) => string) | null = null;

  constructor(
    type: AssignAction,
    assignment: Map<string, string> | null,
    assignmentFn: ((event: EventObject) => string) | null,
  ) {
    super(type, [], null);
    this.type = type;
    this.assignment = assignment;
    this.assignmentFn = assignmentFn;
  }
}

@json
export class ActionClass {
  value: string;
  action: ActionObject | null = null;
  // actionFn: StateMachine.ActionFunction | null;
  // assignAction: AssignActionObject | null;

  constructor(
    value: string,
    action: ActionObject | null,
    // actionFn: StateMachine.ActionFunction | null,
    // assignAction: AssignActionObject | null,
  ) {
    this.value = value;
    this.action = action;
    // this.actionFn = actionFn;
    // this.assignAction = assignAction;
  }
}

@json
export class Transition {
  target: string;
  actions: Array<ActionObject>;
  guard: ActionObject | null = null;
  meta: Array<ActionParam>;

  constructor(
    target: string,
    actions: Array<ActionObject>,
    guard: ActionObject | null,
    meta: Array<ActionParam>,
  ) {
    this.target = target;
    this.actions = actions;
    this.guard = guard;
    this.meta = meta;
  }
}

@json
export class TransitionExternal {
  name: string;
  transitions: Transition[];

  constructor(
    name: string,
    transitions: Transition[],
  ) {
    this.name = name;
    this.transitions = transitions;
  }
}

export class StateInfoClass implements StateInfo {
  always: Array<Transition>;
  after: StateTimers | null = null;
  on: StateInfoEvents;
  exit: Array<ActionObject>;
  entry: Array<ActionObject>;
  initial: string;
  states: States;

  constructor(
    always: Array<Transition>,
    after: StateTimers | null,
    on: StateInfoEvents,
    exit: Array<ActionObject>,
    entry: Array<ActionObject>,
    initial: string,
    childstates: States,
  ) {
    this.always = always;
    this.after = after;
    this.on = on;
    this.exit = exit;
    this.entry = entry;
    this.initial = initial;
    this.states = childstates;
  }
}

@json
export class StateInfoClassExternal {
  name: string;
  always: Array<TransitionExternal>;
  after: Array<TransitionExternal>;
  on: Array<TransitionExternal>;
  exit: Array<ActionObject>;
  entry: Array<ActionObject>;
  initial: string;
  states: Array<StateInfoClassExternal>;

  constructor(
    name: string,
    always: Array<TransitionExternal>,
    after: Array<TransitionExternal>,
    on: Array<TransitionExternal>,
    exit: Array<ActionObject>,
    entry: Array<ActionObject>,
    initial: string,
    childstates: Array<StateInfoClassExternal>,
  ) {
    this.name = name;
    this.always = always;
    this.after = after;
    this.on = on;
    this.exit = exit;
    this.entry = entry;
    this.initial = initial;
    this.states = childstates;
  }

  static fromInternalStatesMap(
    states: States,
  ): Array<StateInfoClassExternal> {
    const estates: Array<StateInfoClassExternal> = [];
    const statesKeys = states.keys();
    for (let i = 0; i < statesKeys.length; i++) {
      const estate = StateInfoClassExternal.fromInternal(states.get(statesKeys[i]), statesKeys[i]);
      estates.push(estate);
    }
    return estates;
  }

  static fromInternal(
    stateInfo: StateInfo,
    stateName: string,
  ): StateInfoClassExternal {
    const onevents: Array<TransitionExternal> = [];
    const stateInfoOn = stateInfo.on.keys();
    for (let j = 0; j < stateInfoOn.length; j++) {
        const evInfos = stateInfo.on.get(stateInfoOn[j]);
        const transitions: Transition[] = [];
        for (let i = 0; i < evInfos.length; i++) {
          const evInfo = evInfos[i];
          const evActions: Array<ActionObject> = [];
          for (let k = 0; k < evInfo.actions.length; k++) {
            const actionobj = evInfo.actions[k];
            evActions.push(new ActionObject(actionobj.type, actionobj.params, actionobj.event));
            const tr = new Transition(
              evInfo.target,
              evActions,
              evInfo.guard,
              evInfo.meta,
            )
            transitions.push(tr);
          }
        }
        onevents.push(new TransitionExternal(stateInfoOn[j], transitions));
    }
    let afterTimers: Array<TransitionExternal> = [];
    const afterT = stateInfo.after;
    if (afterT != null) {
      afterTimers = afterInternalToExternal(afterT);
    }
    let alwaysTransitions = alwaysInternalToExternal(stateInfo.always);

    return new StateInfoClassExternal(
      stateName,
      alwaysTransitions,
      afterTimers,
      onevents,
      [], // TODO stateInfo.exit
      [], // TODO stateInfo.entry
      stateInfo.initial,
      StateInfoClassExternal.fromInternalStatesMap(stateInfo.states),
    );
  }

  static toInternalFromArray(ostates: Array<StateInfoClassExternal>): States {
    const states = new Map<string,StateInfo>();
    for (let i = 0; i < ostates.length; i++) {
      const state = ostates[i].toInternal();
      states.set(ostates[i].name, state);
    }
    return states;
  }

  toInternal(): StateInfo {
    const stateon: StateInfoEvents = new Map<string,Transition[]>();
    for (let j = 0; j < this.on.length; j++) {
        const onev = this.on[j];
        const transitions: Transition[] = [];
        for (let i = 0; i < onev.transitions.length; i++) {
          const onevtr = onev.transitions[i];
          const actions: Array<ActionObject> = [];
          for (let k = 0; k < onevtr.actions.length; k++) {
              const action = onevtr.actions[k];
              actions.push(new ActionObject(action.type, action.params, action.event));
          }
          const tr = new Transition(
            onevtr.target,
            actions,
            onevtr.guard,
            onevtr.meta,
          )
          transitions.push(tr)
        }
        stateon.set(onev.name, transitions);
    }
    let afterTimers: StateTimers | null = null;
    if (this.after.length > 0) {
      afterTimers = afterExternalToInternal(this.after);
    }
    let alwaysTransitions = alwaysExternalToInternal(this.always);

    const childstates = StateInfoClassExternal.toInternalFromArray(this.states);
    return new StateInfoClass(
      alwaysTransitions,
      afterTimers,
      stateon,
      this.exit,
      this.entry,
      this.initial,
      childstates,
    )
  }
}

@json
export class ContextParam {
  key: string = "";
  value: string = "";

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }
}

export class ContextParamRaw {
  key: ArrayBuffer = new ArrayBuffer(0);
  value: ArrayBuffer = new ArrayBuffer(0);

  constructor(key: ArrayBuffer, value: ArrayBuffer) {
    this.key = key;
    this.value = value;
  }
}

@json
export class TimerArgs {
  delay: string;
  state: string;
  intervalId: i64;
  constructor(delay: string, state: string, intervalId: i64) {
    this.delay = delay;
    this.state = state;
    this.intervalId = intervalId;
  }
}

@json
export class ExternalActionCallData {
    method: string;
    params: ActionParam[]
    event: EventObject
    constructor(method: string, params: ActionParam[], event: EventObject) {
        this.method = method
        this.params = params
        this.event = event
    }
}

export function afterInternalToExternal(afterT: StateTimers): Array<TransitionExternal> {
  let afterTimers: Array<TransitionExternal> = [];
  const keys = afterT.keys();
  for (let i = 0; i < keys.length; i++) {
    const delay = keys[i];
    const delayedTransitions = afterT.get(delay);
    const transitions: Transition[] = [];
    for (let j = 0; j < delayedTransitions.length; j++) {
      const delayedTransition = delayedTransitions[j];
      const dActions: Array<ActionObject> = [];
      for (let k = 0; k < delayedTransition.actions.length; k++) {
          const actionobj = delayedTransition.actions[k];
          dActions.push(new ActionObject(actionobj.type, actionobj.params, actionobj.event));
      }
      const tr = new Transition(
        delayedTransition.target,
        dActions,
        delayedTransition.guard,
        delayedTransition.meta,
      );
      transitions.push(tr);
    }

    const afterTimer = new TransitionExternal(
      delay,
      transitions,
    );
    afterTimers.push(afterTimer);
  }
  return afterTimers;
}

export function alwaysInternalToExternal(always: Transition[]): Array<TransitionExternal> {
  let alwaysTransitions = new Array<TransitionExternal>(always.length);
  for (let i = 0; i < always.length; i++) {
    const tr = always[i];
    const alwaysActions: Array<ActionObject> = [];
    for (let k = 0; k < tr.actions.length; k++) {
      const actionobj = tr.actions[k];
      alwaysActions.push(new ActionObject(actionobj.type, actionobj.params, actionobj.event));
    }
    const alwaystr = new Transition(
      tr.target,
      alwaysActions,
      tr.guard,
      tr.meta,
    )
    alwaysTransitions[i] = new TransitionExternal(
      "always",
      [alwaystr],
    );
  }
  return alwaysTransitions;
}

export function afterExternalToInternal(after: Array<TransitionExternal>): StateTimers {
  const afterTimers: StateTimers = new Map();
  for (let i = 0; i < after.length; i++) {
    const aft = after[i];
    const transitions: Transition[] = [];
    for (let t = 0; t < aft.transitions.length; t++) {
      const afttr = aft.transitions[t];
      const actions: Array<ActionObject> = [];
      for (let k = 0; k < afttr.actions.length; k++) {
          const action = afttr.actions[k];
          actions.push(new ActionObject(action.type, action.params, action.event));
      }
      const transition = new Transition(afttr.target, actions, afttr.guard, afttr.meta);
      transitions.push(transition);
    }
    afterTimers.set(aft.name, transitions);
  }
  return afterTimers;
}

export function alwaysExternalToInternal(always: Array<TransitionExternal>): Transition[] {
  let alwaysTransitions = new Array<Transition>(always.length);
  for (let i = 0; i < always.length; i++) {
    const trext = always[i];
    // we expect one transition here
    if (trext.transitions.length == 0) {
      throw new Error("always TransitionExternal does not have any transitions")
    }
    const tr = trext.transitions[0];
    alwaysTransitions[i] = new Transition(
      tr.target,
      tr.actions,
      tr.guard,
      tr.meta,
    );
  }
  return alwaysTransitions;
}
