import { JSON } from "json-as";

export const MODULE_NAME = "wasmx-env-sql"

type Base64String = string;

@json
export class MsgConnectRequest {
    driver: string = ""
    connection: string = ""
    id: string = ""
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

@json
export class MsgConnectRequestPostgresql {
    connection: string = ""
    db_name: string = ""
    id: string = ""
    constructor(
        connection: string,
        db_name: string,
        id: string,
    ) {
        this.connection = connection
        this.db_name = db_name
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
export class MsgExecuteRequest {
    id: string = ""
    query: string = ""
    params: Base64String[] = [] // base64 encoded array of parameters
    constructor(
        id: string,
        query: string,
        params: string[],
    ) {
        this.id = id
        this.query = query
        this.params = params
    }
}

@json
export class SqlExecuteCommand {
    query: string = ""
    params: Base64String[] = []
    constructor(
        query: string,
        params: Base64String[],
    ) {
        this.query = query
        this.params = params
    }
}

@json
export class MsgExecuteBatchRequest {
    id: string = ""
    commands: SqlExecuteCommand[] = []
    constructor(
        id: string,
        commands: SqlExecuteCommand[],
    ) {
        this.id = id
        this.commands = commands
    }
}

@json
export class MsgExecuteBatchResponse {
    error: string = ""
    responses: MsgExecuteResponse[] = []
    constructor(error: string, responses: MsgExecuteResponse[]) {
        this.error = error
        this.responses = responses
    }
}

@json
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


@json
export class MsgExecuteResponsePostgreSql {
    error: string
    rows_affected: i64
    constructor(
        error: string,
        rows_affected: i64,
    ) {
        this.error = error
        this.rows_affected = rows_affected
    }
}

@json
export class MsgExecuteBatchResponsePostgreSql {
    error: string = ""
    responses: MsgExecuteResponsePostgreSql[] = []
    constructor(error: string, responses: MsgExecuteResponsePostgreSql[]) {
        this.error = error
        this.responses = responses
    }
}

@json
export class MsgQueryRequest {
    id: string = ""
    query: string = ""
    // Params []interface{} `json:"params"`
    params: Base64String[] = [] // base64 encoded array of parameters
    constructor(
        id: string,
        query: string,
        params: Base64String[],
    ) {
        this.id = id
        this.query = query
        this.params = params
    }
}

@json
export class MsgQueryResponse {
    error: string
    data: string
    constructor(error: string, data: string) {
        this.error = error
        this.data = data
    }
}

@json
export class MsgPingRequest {
    id: string = ""
    constructor(
        id: string,
    ) {
        this.id = id
    }
}

@json
export class MsgPingResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}

@json
export class MsgCreateDatabaseRequest {
    connection: string = ""
    db_name: string = ""
    constructor(
        connection: string,
        db_name: string,
    ) {
        this.connection = connection
        this.db_name = db_name
    }
}

@json
export class MsgCreateDatabaseResponse {
    error: string
    constructor(error: string) {
        this.error = error
    }
}
