import * as wasmxwrap from 'wasmx-env/assembly/wasmx_wrap';
import * as wasmx from 'wasmx-env/assembly/wasmx';
import {
    EventObject,
    ActionParam,
    MODULE_NAME,
} from './types';

export function LoggerInfo(msg: string, parts: string[]): void {
    wasmxwrap.LoggerInfo(MODULE_NAME, msg, parts)
}

export function LoggerError(msg: string, parts: string[]): void {
    wasmxwrap.LoggerError(MODULE_NAME, msg, parts)
}

export function LoggerDebug(msg: string, parts: string[]): void {
    wasmxwrap.LoggerDebug(MODULE_NAME, msg, parts)
}

export function revert(message: string): void {
    LoggerError("revert", ["err", message, "module", MODULE_NAME])
    wasmx.revert(String.UTF8.encode(message));
    throw new Error(message);
}

export function ctxToActionParams(ctx: Map<string,string>): ActionParam[] {
    const keys = ctx.keys();
    const params: ActionParam[] = new Array<ActionParam>(keys.length);
    for (let i = 0; i < keys.length; i++) {
      params[i] = new ActionParam(keys[i], ctx.get(keys[i]));
    }
    return params;
}

export function actionParamsToMap(params: ActionParam[]): Map<string,string> {
    const ctx = new Map<string,string>()
    for (let i = 0; i < params.length; i++) {
        ctx.set(params[i].key, params[i].value);
    }
    return ctx;
}

export function getParamsOrEventParams(params: ActionParam[], event: EventObject): ActionParam[] {
    return params.concat(event.params)
}

