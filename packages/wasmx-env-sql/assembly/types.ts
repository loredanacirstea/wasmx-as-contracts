import { JSON } from "json-as/assembly";

// @ts-ignore
@serializable
export class MsgConnectRequest {
    driver: string
    connection: string
    id: string
    constructor(
        driver: string,
        connection: string,
        id: string,
    ) {
        this.driver = driver
        this.connection = connection
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
export class MsgExecuteRequest {
    id: string
    query: string
    constructor(
        id: string,
        query: string
    ) {
        this.id = id
        this.query = query
    }
}

// @ts-ignore
@serializable
export class MsgExecuteResponse {
    error: string
    last_insert_id: i64
    last_insert_id_error: string
    rows_affected: i64
    rows_affected_error: string
    constructor(
        error: string,
        last_insert_id: i64,
        last_insert_id_error: string,
        rows_affected: i64,
        rows_affected_error: string,
    ) {
        this.error = error
        this.last_insert_id = last_insert_id
        this.last_insert_id_error = last_insert_id_error
        this.rows_affected = rows_affected
        this.rows_affected_error = rows_affected_error
    }
}

// @ts-ignore
@serializable
export class MsgQueryRequest {
    id: string
    query: string
    constructor(
        id: string,
        query: string
    ) {
        this.id = id
        this.query = query
    }
}

// @ts-ignore
@serializable
export class MsgQueryResponse {
    error: string
    data: string
    constructor(error: string, data: string) {
        this.error = error
        this.data = data
    }
}

// @ts-ignore
@serializable
export class MsgPingRequest {
    id: string = ""
    constructor(
        id: string,
    ) {
        this.id = id
    }
}

// @ts-ignore
@serializable
export class MsgPingResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}
