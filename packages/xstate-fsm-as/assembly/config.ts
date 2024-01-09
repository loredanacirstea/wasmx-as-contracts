import {
    EventObject,
    AssignAction,
  } from './types';

export const REVERT_IF_UNEXPECTED_STATE = false;

export const INIT_EVENT = new EventObject("initialize", []);
export const ASSIGN_ACTION: AssignAction = 'xstate.assign';
export const WILDCARD = '*';
export const INTERVAL_ID_KEY = "intervalIdKey";
