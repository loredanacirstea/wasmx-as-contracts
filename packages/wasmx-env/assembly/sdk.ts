import { CallResponse } from "./types"
import { callContract } from "./utils"

export class SDK {
    roleOrAddress: string = ""
    caller_module_name: string = ""
    revert: (message: string) => void
    LoggerInfo: (msg: string, parts: string[]) => void
    LoggerError: (msg: string, parts: string[]) => void
    LoggerDebug: (msg: string, parts: string[]) => void
    LoggerDebugExtended: (msg: string, parts: string[]) => void
    constructor(
        caller_module_name: string,
        revert: (message: string) => void,
        LoggerInfo: (msg: string, parts: string[]) => void,
        LoggerError: (msg: string, parts: string[]) => void,
        LoggerDebug: (msg: string, parts: string[]) => void,
        LoggerDebugExtended: (msg: string, parts: string[]) => void,
    ) {
        this.caller_module_name = caller_module_name
        this.revert = revert
        this.LoggerInfo = LoggerInfo
        this.LoggerError = LoggerError
        this.LoggerDebug = LoggerDebug
        this.LoggerDebugExtended = LoggerDebugExtended
    }

    call(calld: string, isQuery: boolean): CallResponse {
        return callContract(this.roleOrAddress, calld, isQuery, this.caller_module_name)
    }

    query(calld: string): CallResponse {
        return this.call(calld, true)
    }

    execute(calld: string): CallResponse {
        return this.call(calld, false)
    }

    callSafe(calld: string, isQuery: boolean): string {
        const resp = this.call(calld, isQuery)
        if (resp.success > 0) {
            this.revert(`call to ${this.roleOrAddress} failed: ${resp.data}`)
        }
        return resp.data
    }

    querySafe(calld: string): string {
        const resp = this.query(calld)
        if (resp.success > 0) {
            this.revert(`query call to ${this.roleOrAddress} failed: ${resp.data}`)
        }
        return resp.data
    }

    executeSafe(calld: string): string {
        const resp = this.execute(calld)
        if (resp.success > 0) {
            this.revert(`execute call to ${this.roleOrAddress} failed: ${resp.data}`)
        }
        return resp.data
    }
}
