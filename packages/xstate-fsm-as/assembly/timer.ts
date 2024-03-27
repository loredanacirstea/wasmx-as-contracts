import {INTERVAL_ID_KEY} from './config';
import * as storage from './storage';
import { LoggerDebug, revert } from "./utils";
import {
  EventObject,
  State,
  ActionParam,
} from './types';
import { parseInt32, parseInt64 } from 'wasmx-utils/assembly/utils';

// valid interval Id starts at 1

export function getLastIntervalId(): i64 {
  const value = storage.getContextValue(INTERVAL_ID_KEY);
  if (value === "") return i64(0);
  return parseInt32(value);
}

export function setLastIntervalId(value: i64): void {
  storage.setContextValue(INTERVAL_ID_KEY, value.toString());
}

export function registerIntervalIdKey(state: string, delay: string, intervalId: i64): string {
  return `${INTERVAL_ID_KEY}_${state}_${delay}_${intervalId.toString()}`
}

export function registerLastIntervalIdKey(state: string, delay: string): string {
  return `${INTERVAL_ID_KEY}_${state}_${delay}`
}

export function registerIntervalId(state: string, delay: string, intervalId: i64): void {
  storage.setContextValue(registerLastIntervalIdKey(state, delay), intervalId.toString());
  storage.setContextValue(registerIntervalIdKey(state, delay, intervalId), "1");
}

export function getLastIntervalIdForState(state: string, delay: string): i64 {
  const lastIntervalId = storage.getContextValue(registerLastIntervalIdKey(state, delay))
  if (lastIntervalId == "") {
    return 0;
  }
  return parseInt64(lastIntervalId);
}

export function isRegisteredIntervalActive(state: string, delay: string, intervalId: i64): boolean {
  const value = storage.getContextValue(registerIntervalIdKey(state, delay, intervalId));
  if (value == "1") return true;
  return false;
}

export function cancelIntervals(state: string, delay: string): void {
  const lastIntervalId = getLastIntervalIdForState(state, delay)
  // first intervalId is 1
  if (lastIntervalId == 0) return;
  tryCancelIntervals(state, delay, lastIntervalId);
}

export function tryCancelIntervals(state: string, delay: string, intervalId: i64): void {
  LoggerDebug("cancel interval: ", ["state", state, "delay", delay, "intervalId", intervalId.toString()])
  const active = isRegisteredIntervalActive(state, delay, intervalId);
  // remove the interval data
  removeInterval(state, delay, intervalId);
  if (active && intervalId > 0) {
    tryCancelIntervals(state, delay, intervalId - 1);
  }
}

export function removeInterval(state: string, delay: string, intervalId: i64): void {
  return storage.setContextValue(registerIntervalIdKey(state, delay, intervalId), "");
}

export function cancelActiveIntervals(
  state: State,
  params: ActionParam[],
  event: EventObject,
): void {
  if (params.length == 0) {
    params = event.params;
  }
  let delay = "";
  for (let i = 0; i < params.length; i++) {
    if (params[i].key === "after") {
      delay = params[i].value;
      break;
    }
  }
  if (delay === "") {
    revert("no delay found");
  }
  // we cancel delayed actions for both previous and next state if they have the delay key
  cancelIntervals(state.previousValue, delay);
  cancelIntervals(state.value, delay);
}
