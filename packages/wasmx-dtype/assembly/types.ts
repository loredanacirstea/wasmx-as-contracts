import { JSON } from "json-as/assembly";
import { Base64String } from "wasmx-env/assembly/types";

export const MODULE_NAME = "dtype"

// @ts-ignore
@serializable
export class CallDataInstantiate {
    dir: string = ""
    driver: string = ""
    constructor(dir: string, driver: string) {
        this.dir = dir
        this.driver = driver
    }
}

// @ts-ignore
@serializable
export class CreateTableRequest {
    table_id: i64
    constructor(table_id: i64) {
        this.table_id = table_id
    }
}

// @ts-ignore
@serializable
export class InsertRequest {
    db_connection_id: i64 = 0
    db_id: i64 = 0
    table_id: i64 = 0
    db_connection_name: string = ""
    db_name: string = ""
    table_name: string = ""
    data: Base64String = ""
    constructor(
        db_connection_id: i64,
        db_id: i64,
        table_id: i64,
        db_connection_name: string,
        db_name: string,
        table_name: string,
        data: Base64String,
    ) {
        this.db_connection_id = db_connection_id
        this.db_id = db_id
        this.table_id = table_id
        this.db_connection_name = db_connection_name
        this.db_name = db_name
        this.table_name = table_name
        this.data = data
    }
}

// @ts-ignore
@serializable
export class UpdateRequest {
    database_id: i64
    table_id: i64
    data: Base64String
    constructor(
        database_id: i64,
        table_id: i64,
        data: Base64String,
    ) {
        this.database_id = database_id
        this.table_id = table_id
        this.data = data
    }
}

// @ts-ignore
@serializable
export class ReadRequest {}

// @ts-ignore
@serializable
export class DTypeDbConnection {
    id: i64 = 0
    connection: string = ""
    driver: string = ""
    name: string = ""
    constructor(id: i64, connection: string, driver: string, name: string) {
        this.id = id
        this.connection = connection
        this.driver = driver
        this.name = name
    }
}

// @ts-ignore
@serializable
export class DTypeDb {
    id: i64 = 0
    connection_id: i64 = 0
    name: string = ""
    constructor(id: i64, connection_id: i64, name: string) {
        this.id = id
        this.connection_id = connection_id
        this.name = name
    }
}

// @ts-ignore
@serializable
export class DTypeTable {
    id: i64 = 0
    db_id: i64 = 0
    name: string = ""
    constructor(id: i64, db_id: i64, name: string) {
        this.id = id
        this.db_id = db_id
        this.name = name
    }
}

// @ts-ignore
@serializable
export class DTypeField {
    id: i64 = 0
    table_id: i64 = 0
    name: string = ""
    order_index: i32 = 0
    value_type: string = ""
    indexed: bool = false
    permissions: string = ""
    constructor(id: i64, table_id: i64, name: string, order_index: i32, value_type: string, indexed: bool, permissions: string) {
        this.id = id
        this.table_id = table_id
        this.name = name
        this.order_index = order_index
        this.value_type = value_type
        this.indexed = indexed
        this.permissions = permissions
    }
}

// @ts-ignore
@serializable
export class ConnectRequest {
    id: i64 = 0
    name: string = ""
    constructor(id: i64, name: string) {
        this.id = id
        this.name = name
    }
}
