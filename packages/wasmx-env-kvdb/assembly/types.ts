import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "wasmx-env-kvdb"

@json
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

@json
export class MsgConnectResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}

@json
export class MsgCloseRequest {
    id: string
    constructor(
        id: string,
    ) {
        this.id = id
    }
}

@json
export class MsgCloseResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}

@json
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

@json
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

@json
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

@json
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

@json
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

@json
export class KvSetResponse {
    error: string = ""
    constructor(
        error: string,
    ) {
        this.error = error
    }
}

@json
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

@json
export class KvDeleteResponse {
    error: string = ""
    constructor(
        error: string,
    ) {
        this.error = error
    }
}

@json
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

@json
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

@json
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

@json
export class KvNewBatchResponse {
    error: string = ""
    constructor(
        error: string,
    ) {
        this.error = error
    }
}

@json
export class KvStatsRequest {
    id: string = ""
    constructor(
        id: string,
    ) {
        this.id = id
    }
}
