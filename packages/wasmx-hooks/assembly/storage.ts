import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Hook } from "wasmx-env/assembly/hooks"
import { Params } from "./types";

export const SPLIT = "."
export const PARAMS_KEY = "params"
// moduleOrContract[]
export const HOOKS_KEY = "hooknames"
// hook => module[]
export const HOOK_TO_MODULES_KEY = "hook."

export function getHookKey(hook: string): string {
    return HOOK_TO_MODULES_KEY + hook
}

export function getHookByName(hook: string): Hook | null {
    const value = wasmxw.sload(getHookKey(hook));
    if (value == "") return null;
    return JSON.parse<Hook>(value);
}

export function addModulesByHookName(hookName: string, modules: string[]): void {
    const hook = getHookByName(hookName)
    if (!hook) return;
    for (let i = 0; i < modules.length; i++) {
        if (!hook.targetModules.includes(modules[i])) {
            hook.targetModules.push(modules[i])
        }
    }
    setHookByName(hook);
}

export function setHookByName(hook: Hook): void {
    return wasmxw.sstore(getHookKey(hook.name), JSON.stringify<Hook>(hook));
}

export function addHook(hook: string): void {
    const hooks = getHookNames()
    if (!hooks.includes(hook)) {
        hooks.push(hook)
        setHooks(hooks);
    }
}

export function getHookNames(): string[] {
    const value = wasmxw.sload(HOOKS_KEY);
    if (value == "") return []
    return JSON.parse<string[]>(value);
}

export function setHooks(hooks: string[]): void {
    return wasmxw.sstore(HOOKS_KEY, JSON.stringify<string[]>(hooks));
}

export function getParams(): Params {
    const value = wasmxw.sload(PARAMS_KEY);
    if (value == "") return new Params()
    return JSON.parse<Params>(value);
}

export function setParams(params: Params): void {
    return wasmxw.sstore(PARAMS_KEY, JSON.stringify<Params>(params));
}
