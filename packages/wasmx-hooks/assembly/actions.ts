import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { BigInt } from "wasmx-env/assembly/bn"
import { Hook } from "wasmx-env/assembly/hooks"
import { DEFAULT_GAS_TX } from "wasmx-env/assembly/const";
import { MODULE_NAME, MsgInitialize, MsgRunHook, MsgSetHook, Params, QueryHookModulesRequest, QueryHookModulesResponse, QueryHooksRequest, QueryHooksResponse } from "./types";
import { LoggerDebug, LoggerError, revert } from "./utils";
import { getHookNames, getHookByName, setHooks, setHookByName } from "./storage";
import { Base64String, CallRequest } from "wasmx-env/assembly/types";

export function Initialize(req: MsgInitialize): ArrayBuffer {
    const names: string[] = []
    for (let i = 0; i < req.hooks.length; i++) {
        const name = req.hooks[i].name
        if (names.includes(name)) {
            revert(`duplicate hook definition: ${name}`)
        }
        names.push(name)
        setHookByName(req.hooks[i])
    }
    setHooks(names)
    return new ArrayBuffer(0)
}

export function SetHook(req: MsgSetHook): ArrayBuffer {
    const caller = wasmxw.getCaller()
    const role = wasmxw.getRoleByAddress(caller);
    if (role == "") {
        revert(`unauthorized hook action: SetHook: caller ${caller}`)
    }

    setHookInternal(req.hook, role, req.modules)
    return new ArrayBuffer(0)
}

export function RunHook(req: MsgRunHook): ArrayBuffer {
    const hook = getHookByName(req.hook)
    if (!hook) return new ArrayBuffer(0)

    requireSource(hook, "RunHook")
    if (!hook) return new ArrayBuffer(0)
    LoggerDebug("run hooks", ["hook", req.hook, "modules", hook.targetModules.join(",")])
    for (let i = 0; i < hook.targetModules.length; i++) {
        const moduleOrContract = hook.targetModules[i]
        makeHookCall(req.hook, moduleOrContract, req.data);
    }
    return new ArrayBuffer(0)
}

export function GetHooks(req: QueryHooksRequest): ArrayBuffer {
    const hooks = getHookNames()
    const resp = new QueryHooksResponse(hooks)
    return String.UTF8.encode(JSON.stringify<QueryHooksResponse>(resp))
}

export function GetHookModules(req: QueryHookModulesRequest): ArrayBuffer {
    const hook = getHookByName(req.hook)
    let modules: string[] = []
    if (hook) {
        modules = hook.targetModules;
    }
    const resp = new QueryHookModulesResponse(modules)
    return String.UTF8.encode(JSON.stringify<QueryHookModulesResponse>(resp))
}

function setHookInternal(hookName: string, sourceModule: string, targetModules: string[]): void {
    const hooks = getHookNames()
    if (!hooks.includes(hookName)) {
        hooks.push(hookName)
        setHooks(hooks)
    }
    let hook = getHookByName(hookName)
    if (hook == null) {
        hook = new Hook(hookName, [sourceModule], targetModules);
    } else {
        if (!hook.sourceModules.includes(sourceModule)) {
            hook.sourceModules.push(sourceModule);
        }
        for (let i = 0; i < targetModules.length; i++) {
            if (!hook.targetModules.includes(targetModules[i])) {
                hook.targetModules.push(targetModules[i]);
            }
        }
    }
    setHookByName(hook);
}

function makeHookCall(hook: string, moduleOrContract: string, data: Base64String): void {
    LoggerDebug("hook call", ["hook", hook, "module", moduleOrContract])
    const calldata = `{"${hook}":{"data":"${data}"}}`
    const req = new CallRequest(moduleOrContract, calldata, BigInt.zero(), DEFAULT_GAS_TX, false);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    if (resp.success > 0) {
        LoggerError("hook call failed", ["hook", hook, "module", moduleOrContract, "error", resp.data])
    }
}

function requireSource(hook: Hook, message: string): void {
    const caller = wasmxw.getCaller()
    const role = wasmxw.getRoleByAddress(caller);
    if (role == "") {
        revert(`unauthorized hook action: ${hook.name}: caller ${caller}: ${message}`)
    }
    if (!hook.sourceModules.includes(role)) {
        revert(`unauthorized hook action: ${hook.name}: caller ${caller} role ${role} is not included in ${hook.sourceModules.join(",")}: ${message}`)
    }
}
