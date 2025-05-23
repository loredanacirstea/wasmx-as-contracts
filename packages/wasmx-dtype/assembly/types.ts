import { JSON } from "json-as";
import { Base64String } from "wasmx-env/assembly/types";
export { MsgExecuteBatchResponse, MsgQueryResponse } from "wasmx-env-sql/assembly/types";

export const MODULE_NAME = "dtype"

@json
export class CallDataInitializeTokens {}

@json
export class CallDataInstantiate {
    dir: string = ""
    driver: string = ""
    constructor(dir: string, driver: string) {
        this.dir = dir
        this.driver = driver
    }
}

@json
export class CreateTableRequest {
    table_id: i64
    constructor(table_id: i64) {
        this.table_id = table_id
    }
}

@json
export class TableIndex {
    fields: string[] = []
    isunique: boolean = false
    constructor(fields: string[], isunique: boolean) {
        this.fields = fields
        this.isunique = isunique
    }
}

@json
export class CreateIndexesRequest {
    identifier: TableIndentifier
    indexes: TableIndex[]
    constructor(identifier: TableIndentifier, indexes: TableIndex[]) {
        this.identifier = identifier
        this.indexes = indexes
    }
}

@json
export class CreateIndexResponse {
    names: string[] = []
    constructor(names: string[]) {
        this.names = names
    }
}

@json
export class DeleteIndexesRequest {
    identifier: TableIndentifier
    names: string[] = []
    constructor(identifier: TableIndentifier, names: string[]) {
        this.identifier = identifier
        this.names = names
    }
}

@json
export class DeleteIndexResponse {}

@json
export class TableIndentifier {
    db_connection_id: i64 = 0
    db_id: i64 = 0
    table_id: i64 = 0
    db_connection_name: string = ""
    db_name: string = ""
    table_name: string = ""
    constructor(
        db_connection_id: i64,
        db_id: i64,
        table_id: i64,
        db_connection_name: string,
        db_name: string,
        table_name: string,
    ) {
        this.db_connection_id = db_connection_id
        this.db_id = db_id
        this.table_id = table_id
        this.db_connection_name = db_connection_name
        this.db_name = db_name
        this.table_name = table_name
    }
}

@json
export class TableIndentifierRequired {
    db_id: i64 = 0
    table_id: i64 = 0
    db_connection_name: string = ""
    db_name: string = ""
    table_name: string = ""
    constructor(
        db_id: i64,
        table_id: i64,
        db_connection_name: string,
        db_name: string,
        table_name: string,
    ) {
        this.db_id = db_id
        this.table_id = table_id
        this.db_connection_name = db_connection_name
        this.db_name = db_name
        this.table_name = table_name
    }
}

@json
export class InsertRequest {
    identifier: TableIndentifier
    data: Base64String = ""
    constructor(
        identifier: TableIndentifier,
        data: Base64String,
    ) {
        this.identifier = identifier
        this.data = data
    }
}

@json
export class UpdateRequest {
    identifier: TableIndentifier
    condition: Base64String
    data: Base64String
    constructor(
        identifier: TableIndentifier,
        condition: Base64String,
        data: Base64String,
    ) {
        this.identifier = identifier
        this.condition = condition
        this.data = data
    }
}

@json
export class ReadRequest {
    identifier: TableIndentifier
    data: Base64String
    constructor(
        identifier: TableIndentifier,
        data: Base64String,
    ) {
        this.identifier = identifier
        this.data = data
    }
}

@json
export class ReadRawRequest {
    identifier: TableIndentifier
    query: string
    params: Base64String[]
    constructor(
        identifier: TableIndentifier,
        query: string,
        params: Base64String[],
    ) {
        this.identifier = identifier
        this.query = query
        this.params = params
    }
}

@json
export class CountRequest {
    identifier: TableIndentifier
    data: Base64String
    constructor(
        identifier: TableIndentifier,
        data: Base64String,
    ) {
        this.identifier = identifier
        this.data = data
    }
}

@json
export class CountResponse {
    error: string = ""
    count: i64 = 0
    constructor( error: string, count: i64) {
        this.error = error
        this.count = count
    }
}

@json
export class ReadFieldsRequest {
    identifier: TableIndentifier
    fields: string[] = []
    data: Base64String = ""
    constructor(
        identifier: TableIndentifier,
        fields: string[],
        data: Base64String,
    ) {
        this.identifier = identifier
        this.fields = fields
        this.data = data
    }
}

@json
export class GetRecordsByRelationTypeRequest {
    relationTypeId: i64
    relationType: string
    tableId: i64
    recordId: i64
    nodeType: string // "source" || "target"
    constructor(
        relationTypeId: i64,
        relationType: string,
        tableId: i64,
        recordId: i64,
        nodeType: string,
    ) {
        this.relationTypeId = relationTypeId
        this.relationType = relationType
        this.tableId = tableId
        this.recordId = recordId
        this.nodeType = nodeType
    }
}

@json
export class DeleteRequest {
    identifier: TableIndentifier
    condition: Base64String
    constructor(
        identifier: TableIndentifier,
        condition: Base64String,
    ) {
        this.identifier = identifier
        this.condition = condition
    }
}

@json
export class DTypeDbConnection {
    id: i64 = 0
    connection: string = ""
    driver: string = ""
    name: string = ""
    description: string = ""
    constructor(id: i64, connection: string, driver: string, name: string, description: string) {
        this.id = id
        this.connection = connection
        this.driver = driver
        this.name = name
        this.description = description
    }
}

@json
export class DTypeDb {
    id: i64 = 0
    connection_id: i64 = 0
    name: string = ""
    description: string = ""
    constructor(id: i64, connection_id: i64, name: string, description: string) {
        this.id = id
        this.connection_id = connection_id
        this.name = name
        this.description = description
    }
}

@json
export class DTypeTable {
    id: i64 = 0
    db_id: i64 = 0
    name: string = ""
    description: string = ""
    constructor(id: i64, db_id: i64, name: string, description: string) {
        this.id = id
        this.db_id = db_id
        this.name = name
        this.description = description
    }
}

// FOREIGN KEY (user_id) REFERENCES users(id)
//       ON DELETE CASCADE
//       ON UPDATE CASCADE
// or
// user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

@json
export class DTypeField {
    id: i64 = 0
    table_id: i64 = 0
    name: string = ""
    order_index: i32 = 0
    value_type: string = ""
    indexed: bool = false
    sql_options: string = ""
    foreign_key_table: string = ""
    foreign_key_field: string = ""
    foreign_key_sql_options: string = ""
    description: string = ""
    permissions: string = ""
    constructor(
        id: i64, table_id: i64, name: string, order_index: i32, value_type: string, indexed: bool, sql_options: string,
        foreign_key_table: string,
        foreign_key_field: string,
        foreign_key_sql_options: string,
        description: string, permissions: string) {
        this.id = id
        this.table_id = table_id
        this.name = name
        this.order_index = order_index
        this.value_type = value_type
        this.indexed = indexed
        this.sql_options = sql_options
        this.foreign_key_table = foreign_key_table
        this.foreign_key_field = foreign_key_field
        this.foreign_key_sql_options = foreign_key_sql_options
        this.description = description
        this.permissions = permissions
    }
}

@json
export class ConnectRequest {
    id: i64 = 0
    name: string = ""
    constructor(id: i64, name: string) {
        this.id = id
        this.name = name
    }
}

@json
export class CloseRequest {
    id: i64 = 0
    name: string = ""
    constructor(id: i64, name: string) {
        this.id = id
        this.name = name
    }
}

@json
export class BuildSchemaRequest {
    identifier: TableIndentifier
    constructor(
        identifier: TableIndentifier,
    ) {
        this.identifier = identifier
    }
}

@json
export class BuildSchemaResponse {
    data: Base64String
    constructor(
        data: Base64String,
    ) {
        this.data = data
    }
}

@json
export class QueryParams {
    keys: string[] = []
    values: Base64String[] = []
    constructor(keys: string[],  values: Base64String[]) {
        this.keys = keys
        this.values = values
    }
}
