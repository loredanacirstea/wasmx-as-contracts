import { JSON } from "json-as/assembly";
import * as wasmxw from 'wasmx-env/assembly/wasmx_wrap';
import { Params } from "./types";

export const SPLIT = "."
export const PARAMS_KEY = "params"
// moduleOrContract[]
export const HOOKS_KEY = "hooks"
// hook => module[]
export const HOOK_TO_MODULES_KEY = "hook."

export function getHookKey(hook: string): string {
    return HOOK_TO_MODULES_KEY + hook
}

export function getModulesByHook(hook: string): string[] {
    const value = wasmxw.sload(getHookKey(hook));
    if (value == "") return []
    return JSON.parse<string[]>(value);
}

export function addModuleByHook(hook: string, moduleName: string): void {
    const emodules = getModulesByHook(hook)
    if (!emodules.includes(moduleName)) {
        emodules.push(moduleName)
        setModulesByHook(hook, emodules);
    }
}

export function addModulesByHook(hook: string, modules: string[]): void {
    const emodules = getModulesByHook(hook)
    for (let i = 0; i < modules.length; i++) {
        if (!emodules.includes(modules[i])) {
            emodules.push(modules[i])
        }
    }
    setModulesByHook(hook, emodules);
}

export function setModulesByHook(hook: string, hooks: string[]): void {
    return wasmxw.sstore(getHookKey(hook), JSON.stringify<string[]>(hooks));
}

export function addHook(hook: string): void {
    const hooks = getHooks()
    if (!hooks.includes(hook)) {
        hooks.push(hook)
        setHooks(hooks);
    }
}

export function getHooks(): string[] {
    const value = wasmxw.sload(HOOKS_KEY);
    if (value == "") return []
    return JSON.parse<string[]>(value);
}

export function setHooks(hooks: string[]): void {
    return wasmxw.sstore(HOOKS_KEY, JSON.stringify<string[]>(hooks));
}

export function getParams(): Params {
    const value = wasmxw.sload(PARAMS_KEY);
    if (value == "") return new Params([])
    return JSON.parse<Params>(value);
}

export function setParams(params: Params): void {
    return wasmxw.sstore(PARAMS_KEY, JSON.stringify<Params>(params));
}
