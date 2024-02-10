import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { BigInt } from "wasmx-env/assembly/bn"
import { isAuthorized } from "wasmx-env/assembly/utils";
import { MODULE_NAME, MsgInitialize, MsgRunHook, MsgSetHook, Params, QueryHookModulesRequest, QueryHookModulesResponse, QueryHooksRequest, QueryHooksResponse } from "./types";
import { LoggerDebug, LoggerError, revert } from "./utils";
import { addModulesByHook, getHooks, getModulesByHook, getParams, setHooks, setParams } from "./storage";
import { Base64String, CallRequest } from "wasmx-env/assembly/types";

export function Initialize(req: MsgInitialize): ArrayBuffer {
    setParams(new Params(req.authorities))
    const hooks: string[] = []
    for (let i = 0; i < req.registrations.length; i++) {
        const reg = req.registrations[i]
        if (!hooks.includes(reg.hook)) {
            hooks.push(reg.hook)
        }
        addModulesByHook(reg.hook, reg.modules)
    }
    setHooks(hooks)
    return new ArrayBuffer(0)
}

export function SetHook(req: MsgSetHook): ArrayBuffer {
    requireAuthorization()
    setHookInternal(req)
    return new ArrayBuffer(0)
}

export function RunHook(req: MsgRunHook): ArrayBuffer {
    requireAuthorization()
    const modules = getModulesByHook(req.hook)
    LoggerDebug("run hooks", ["modules", modules.join(",")])
    for (let i = 0; i < modules.length; i++) {
        const moduleOrContract = modules[i]
        makeHookCall(req.hook, moduleOrContract, req.data);
    }
    return new ArrayBuffer(0)
}

export function GetHooks(req: QueryHooksRequest): ArrayBuffer {
    const hooks = getHooks()
    const resp = new QueryHooksResponse(hooks)
    return String.UTF8.encode(JSON.stringify<QueryHooksResponse>(resp))
}

export function GetHookModules(req: QueryHookModulesRequest): ArrayBuffer {
    const modules = getModulesByHook(req.hook)
    const resp = new QueryHookModulesResponse(modules)
    return String.UTF8.encode(JSON.stringify<QueryHookModulesResponse>(resp))
}

function setHookInternal(req: MsgSetHook): void {
    const hooks = getHooks()
    if (!hooks.includes(req.hook)) {
        hooks.push(req.hook)
        setHooks(hooks)
    }
    addModulesByHook(req.hook, req.modules)
}

function makeHookCall(hook: string, moduleOrContract: string, data: Base64String): void {
    LoggerDebug("hook call", ["hook", hook, "module", moduleOrContract])
    const calldata = `{"${hook}":{"data":"${data}"}}`
    const req = new CallRequest(moduleOrContract, calldata, BigInt.zero(), 100000000, false);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    if (resp.success > 0) {
        LoggerError("hook call failed", ["hook", hook, "module", moduleOrContract, "error", resp.data])
    }
}

function requireAuthorization(): void {
    const caller = wasmxw.getCaller()
    const params = getParams()
    if(!isAuthorized(caller, params.authorities)) {
        revert(`unauthorized hooks action: caller ${caller}`)
    }
}
