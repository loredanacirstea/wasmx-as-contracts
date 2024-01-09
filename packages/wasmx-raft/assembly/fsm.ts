
import { JSON } from "json-as/assembly";
import * as wasmx from 'wasmx-env/assembly/wasmx';

// @ts-ignore
@serializable
export enum InterpreterStatus {
  NotStarted = 0,
  Running = 1,
  Stopped = 2
}

// @ts-ignore
@serializable
export class ActionParam {
  key: string;
  value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }
}

// @ts-ignore
@serializable
export class EventObject {
    type: string;
    params: ActionParam[];

    constructor(type: string, params: ActionParam[]) {
      this.type = type;
      this.params = params;
    }
}

// @ts-ignore
@serializable
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

// @ts-ignore
@serializable
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

const STORAGEKEY_CTX = "context_"
const INTERVAL_ID_KEY = "intervalIdKey";

export function setLastIntervalId(value: i64): void {
    setContextValue(INTERVAL_ID_KEY, value.toString());
}

function registerLastIntervalIdKey(state: string, delay: string): string {
    return `${INTERVAL_ID_KEY}_${state}_${delay}`
}

function registerIntervalIdKey(state: string, delay: string, intervalId: i64): string {
    return `${INTERVAL_ID_KEY}_${state}_${delay}_${intervalId.toString()}`
}

export function registerIntervalId(state: string, delay: string, intervalId: i64): void {
    setContextValue(registerLastIntervalIdKey(state, delay), intervalId.toString());
    setContextValue(registerIntervalIdKey(state, delay, intervalId), "1");
}

export function hasContextValue(key: string): boolean {
    const value = String.UTF8.decode(getContextValueInternal(key));
    return value != "";
}

export function getContextValue(key: string): string {
    return String.UTF8.decode(getContextValueInternal(key));
}

export function getContextValueInternal(key: string): ArrayBuffer {
    return wasmx.storageLoad(String.UTF8.encode(STORAGEKEY_CTX + key));
}

export function setContextValue(key: string, value: string): void {
    return setContextValueInternal(key, String.UTF8.encode(value));
}

export function setContextValueInternal(key: string, value: ArrayBuffer): void {
    return wasmx.storageStore(String.UTF8.encode(STORAGEKEY_CTX + key), value);
}
