import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";
import { Hook } from "wasmx-env/assembly/hooks";

export const MODULE_NAME = "hooks"

@json
export class MsgInitialize {
    hooks: Hook[]
    constructor(hooks: Hook[]) {
        this.hooks = hooks
    }
}

@json
export class Params {
    constructor() {
    }
}

@json
export class MsgSetHook {
    hook: string
    modules: string[]
    constructor(hook: string, modules: string[]) {
        this.hook = hook
        this.modules = modules
    }
}

@json
export class MsgRunHook {
    hook: string
    data: Base64String
    constructor(hook: string, data: Base64String) {
        this.hook = hook
        this.data = data
    }
}

@json
export class QueryHookModulesRequest {
    hook: string
    constructor(hook: string) {
        this.hook = hook
    }
}

@json
export class QueryHookModulesResponse {
    modules: string[]
    constructor(modules: string[]) {
        this.modules = modules
    }
}

@json
export class QueryHooksRequest {}

@json
export class QueryHooksResponse {
    hooks: string[]
    constructor(hooks: string[]) {
        this.hooks = hooks
    }
}
