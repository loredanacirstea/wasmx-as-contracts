import { JSON } from "json-as/assembly";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "hooks"

// @ts-ignore
@serializable
export class MsgInitGenesis {
    authorities: string[]
    hooks: string[]
    registrations: MsgSetHook[]
    constructor(authorities: string[], hooks: string[], registrations: MsgSetHook[]) {
        this.authorities = authorities
        this.hooks = hooks
        this.registrations = registrations
    }
}

// @ts-ignore
@serializable
export class Params {
    authorities: string[]
    constructor(authorities: string[]) {
        this.authorities = authorities
    }
}

// @ts-ignore
@serializable
export class MsgSetHook {
    hook: string
    modules: string[]
    constructor(hook: string, modules: string[]) {
        this.hook = hook
        this.modules = modules
    }
}

// @ts-ignore
@serializable
export class MsgRunHook {
    hook: string
    data: Base64String
    constructor(hook: string, data: Base64String) {
        this.hook = hook
        this.data = data
    }
}

// @ts-ignore
@serializable
export class QueryHookModulesRequest {
    hook: string
    constructor(hook: string) {
        this.hook = hook
    }
}

// @ts-ignore
@serializable
export class QueryHookModulesResponse {
    modules: string[]
    constructor(modules: string[]) {
        this.modules = modules
    }
}

// @ts-ignore
@serializable
export class QueryHooksRequest {}

// @ts-ignore
@serializable
export class QueryHooksResponse {
    hooks: string[]
    constructor(hooks: string[]) {
        this.hooks = hooks
    }
}
