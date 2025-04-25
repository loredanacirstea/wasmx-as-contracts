import { JSON } from "json-as/assembly";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "wasmx-env-kvdb"

// @ts-ignore
@serializable
export class MsgConnectRequest {
    driver: string
    dir: string
    name: string
    id: string
    constructor(
        driver: string,
        dir: string,
        name: string,
        id: string,
    ) {
        this.driver = driver
        this.name = name
        this.dir = dir
        this.id = id
    }
}

// @ts-ignore
@serializable
export class MsgConnectResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}

// @ts-ignore
@serializable
export class MsgCloseRequest {
    id: string
    constructor(
        id: string,
    ) {
        this.id = id
    }
}

// @ts-ignore
@serializable
export class MsgCloseResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}

// @ts-ignore
@serializable
export class KvGetRequest {
    id: string = ""
    key: Base64String = ""
    constructor(
        id: string,
        key: string,
    ) {
        this.id = id
        this.key = key
    }
}

// @ts-ignore
@serializable
export class KvGetResponse {
    error: string = ""
    value: Base64String = ""
    constructor(
        error: string,
        value: Base64String,
    ) {
        this.error = error
        this.value = value
    }
}

// @ts-ignore
@serializable
export class KvHasRequest {
    id: string = ""
    key: Base64String = ""
    constructor(
        id: string,
        key: string,
    ) {
        this.id = id
        this.key = key
    }
}

// @ts-ignore
@serializable
export class KvHasResponse {
    error: string = ""
    found: boolean = false
    constructor(
        error: string,
        found: boolean,
    ) {
        this.error = error
        this.found = found
    }
}

// @ts-ignore
@serializable
export class KvSetRequest {
    id: string = ""
    key: Base64String = ""
    value: Base64String = ""
    constructor(
        id: string,
        key: string,
        value: string,
    ) {
        this.id = id
        this.key = key
        this.value = value
    }
}

// @ts-ignore
@serializable
export class KvSetResponse {
    error: string = ""
    constructor(
        error: string,
    ) {
        this.error = error
    }
}

// @ts-ignore
@serializable
export class KvDeleteRequest {
    id: string = ""
    key: Base64String = ""
    constructor(
        id: string,
        key: string,
    ) {
        this.id = id
        this.key = key
    }
}

// @ts-ignore
@serializable
export class KvDeleteResponse {
    error: string = ""
    constructor(
        error: string,
    ) {
        this.error = error
    }
}

// @ts-ignore
@serializable
export class KvIteratorRequest {
    id: string = ""
    start: Base64String = ""
    end: Base64String = ""
    constructor(
        id: string,
        start: string,
        end: string,
    ) {
        this.id = id
        this.start = start
        this.end = end
    }
}

// @ts-ignore
@serializable
export class KvIteratorResponse {
    error: string = ""
    values: Base64String[] = []
    constructor(
        error: string,
        values: Base64String[],
    ) {
        this.error = error
        this.values = values
    }
}

// @ts-ignore
@serializable
export class KvNewBatchRequest {
    id: string = ""
    size: i32 = 0
    constructor(
        id: string,
        size: i32,
    ) {
        this.id = id
        this.size = size
    }
}

// @ts-ignore
@serializable
export class KvNewBatchResponse {
    error: string = ""
    constructor(
        error: string,
    ) {
        this.error = error
    }
}

// @ts-ignore
@serializable
export class KvStatsRequest {
    id: string = ""
    constructor(
        id: string,
    ) {
        this.id = id
    }
}
