import { JSON } from "json-as/assembly";

export const MODULE_NAME = "simple_storage"

// @ts-ignore
@serializable
export class MsgSet {
    key: string = ""
    value: string = ""
}

// @ts-ignore
@serializable
export class MsgGet {
    key: string = ""
}
