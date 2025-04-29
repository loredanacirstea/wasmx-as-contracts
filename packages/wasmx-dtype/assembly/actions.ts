import { JSON } from "json-as/assembly";
import * as sqlw from "wasmx-env-sql/assembly/sql_wrap";
import { base64ToString, stringToBase64, stringToBytes } from "wasmx-utils/assembly/utils";
import { MsgCloseRequest, MsgCloseResponse, MsgConnectRequest, MsgConnectResponse, MsgExecuteBatchRequest, MsgExecuteBatchResponse, MsgExecuteRequest, MsgExecuteResponse, MsgQueryRequest, MsgQueryResponse, SqlExecuteCommand } from "wasmx-env-sql/assembly/types";
import { BuildSchemaRequest, BuildSchemaResponse, CallDataInstantiate, CloseRequest, ConnectRequest, CreateTableRequest, DeleteRequest, DTypeDb, DTypeDbConnection, DTypeField, DTypeTable, InsertRequest, MODULE_NAME, ReadRequest, TableIndentifier, TableIndentifierRequired, UpdateRequest } from "./types";
import { revert } from "./utils";
import { jsonToQueryParams } from "./json";
import { generateJsonSchema } from "./schema";

const DTypeConnection = "dtype_connection"
const DTypeDbName = "dtype_db"
const DTypeDbConnName = "dtype_db_connection"
const DTypeTableName = "dtype_table"
const DTypeFieldName = "dtype_field"

const SqlCreateTableDbConn = `CREATE TABLE IF NOT EXISTS ${DTypeDbConnName} (id INTEGER PRIMARY KEY, connection VARCHAR NOT NULL, driver VARCHAR NOT NULL, name VARCHAR UNIQUE NOT NULL, description TEXT DEFAULT '')`
const SqlCreateIndexDbConn1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbConnName}_name ON ${DTypeDbConnName}(name)`
const SqlCreateIndexDbConn2 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbConnName}_driver ON ${DTypeDbConnName}(driver)`
const SqlCreateTableDb = `CREATE TABLE IF NOT EXISTS ${DTypeDbName} (id INTEGER PRIMARY KEY, name VARCHAR UNIQUE NOT NULL, connection_id INTEGER NOT NULL REFERENCES ${DTypeDbConnName}(id) ON UPDATE CASCADE ON DELETE RESTRICT, description TEXT DEFAULT '')`
const SqlCreateIndexDb1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbName}_connection_id ON ${DTypeDbName}(connection_id)`
const SqlCreateIndexDb2 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbName}_name ON ${DTypeDbName}(name)`
const SqlCreateTableTable = `CREATE TABLE IF NOT EXISTS ${DTypeTableName} (id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, db_id INTEGER NOT NULL REFERENCES ${DTypeDbName}(id) ON UPDATE CASCADE ON DELETE RESTRICT, description TEXT DEFAULT '')`
const SqlCreateIndexTable1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeTableName}_db_id ON ${DTypeTableName}(db_id)`
const SqlCreateIndexTable2 = `CREATE UNIQUE INDEX IF NOT EXISTS idx_${DTypeTableName}_dbid_name ON ${DTypeTableName}(db_id,name)`
const SqlCreateTableField = `CREATE TABLE IF NOT EXISTS ${DTypeFieldName} (id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, table_id INTEGER NOT NULL REFERENCES ${DTypeTableName}(id) ON UPDATE CASCADE ON DELETE RESTRICT, order_index INTEGER NOT NULL, value_type VARCHAR NOT NULL, indexed BOOLEAN NOT NULL DEFAULT false, sql_options VARCHAR NOT NULL DEFAULT '', foreign_key_table VARCHAR NOT NULL DEFAULT '', foreign_key_field VARCHAR NOT NULL DEFAULT '', foreign_key_sql_options VARCHAR NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', permissions VARCHAR NOT NULL DEFAULT '')`
const SqlCreateIndexField1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeFieldName}_table_id ON ${DTypeFieldName}(table_id)`
const SqlCreateIndexField2 = `CREATE UNIQUE INDEX IF NOT EXISTS idx_${DTypeFieldName}_tableid_name ON ${DTypeFieldName}(table_id,name)`
const SqlCreateIndexField3 = `CREATE INDEX IF NOT EXISTS idx_${DTypeFieldName}_value_type ON ${DTypeFieldName}(value_type)`

export function InstantiateDType(req: CallDataInstantiate): ArrayBuffer {
    const dbfile = "dtype.db"
    const dbpath = joinPath(req.dir, dbfile)

    const connectMsg = new MsgConnectRequest(req.driver, dbpath, DTypeConnection);
    const resp = sqlw.Connect(connectMsg, MODULE_NAME);
    if (resp.error != "") {
        revert(`could not connect to ${dbfile}`)
    }
    let createTable: MsgExecuteRequest;
    let respexec: MsgExecuteResponse;

    createTable = new MsgExecuteRequest(DTypeConnection, SqlCreateTableDbConn, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not create table: ${respexec.error}`)
    }

    createTable = new MsgExecuteRequest(DTypeConnection, SqlCreateTableDb, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not create table: ${respexec.error}`)
    }

    createTable = new MsgExecuteRequest(DTypeConnection, SqlCreateTableTable, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not create table: ${respexec.error}`)
    }

    createTable = new MsgExecuteRequest(DTypeConnection, SqlCreateTableField, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not create table: ${respexec.error}`)
    }

    // create indexes
    let queryBatch: SqlExecuteCommand[] = [
        new SqlExecuteCommand(SqlCreateIndexDbConn1, []),
        new SqlExecuteCommand(SqlCreateIndexDbConn2, []),
        new SqlExecuteCommand(SqlCreateIndexDb1, []),
        new SqlExecuteCommand(SqlCreateIndexDb2, []),
        new SqlExecuteCommand(SqlCreateIndexTable1, []),
        new SqlExecuteCommand(SqlCreateIndexTable2, []),
        new SqlExecuteCommand(SqlCreateIndexField1, []),
        new SqlExecuteCommand(SqlCreateIndexField2, []),
        new SqlExecuteCommand(SqlCreateIndexField3, []),
    ]
    let batchReq = new MsgExecuteBatchRequest(DTypeConnection, queryBatch)
    let respBatch = sqlw.BatchAtomic(batchReq);
    if (respBatch.error != "") {
        revert(`could not create table indexes: ${respBatch.error}`)
    }

    // insert rows
    let query: string;
    query = `INSERT OR REPLACE INTO ${DTypeDbConnName}(connection,driver,name,description) VALUES ('${dbpath}','${req.driver}','${DTypeConnection}','dtype database connection')`;
    createTable = new MsgExecuteRequest(DTypeConnection, query, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not insert row in ${DTypeDbConnName}: ${respexec.error}`)
    }

    query = `INSERT OR REPLACE INTO ${DTypeDbName}(connection_id,name,description) VALUES (${respexec.last_insert_id},'dtype','dtype database')`;
    createTable = new MsgExecuteRequest(DTypeConnection, query, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not insert row in ${DTypeDbName}: ${respexec.error}`)
    }

    queryBatch = [
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeTableName}(name,db_id,description) VALUES ('${DTypeDbConnName}',1,'table for defining database connections')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeTableName}(name,db_id,description) VALUES ('${DTypeDbName}',1,'table for defining databases')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeTableName}(name,db_id,description) VALUES ('${DTypeTableName}',1,'table for defining database tables')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeTableName}(name,db_id,description) VALUES ('${DTypeFieldName}',1,'table for defining table fields')`, []),
    ]
    batchReq = new MsgExecuteBatchRequest(DTypeConnection, queryBatch)
    respBatch = sqlw.BatchAtomic(batchReq);
    if (respBatch.error != "") {
        revert(`could not insert tables: ${respBatch.error}`)
    }
    const tableDbConnId = 1;
    const tableDbId = 2;
    const tableTableId = 3;
    const tableFieldsId = 4;

    queryBatch = [
        // db connection fields
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableDbConnId},'id',1,'INTEGER',false,'PRIMARY KEY','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableDbConnId},'connection',2,'VARCHAR',false,'NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableDbConnId},'driver',3,'VARCHAR',true,'NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableDbConnId},'name',4,'VARCHAR',true,'UNIQUE NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableDbConnId},'description',5,'VARCHAR',false,"DEFAULT ''",'','','','','')`, []),

        // db fields
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableDbId},'id',1,'INTEGER',false,'PRIMARY KEY','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableDbId},'name',2,'VARCHAR',true,'UNIQUE NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableDbId},'connection_id',3,'INTEGER',true,'NOT NULL','${DTypeDbConnName}','id','ON UPDATE CASCADE ON DELETE RESTRICT','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableDbId},'description',4,'VARCHAR',false,"DEFAULT ''",'','','','','')`, []),


        // table fields
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableTableId},'id',1,'INTEGER',false,'PRIMARY KEY','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableTableId},'db_id',2,'INTEGER',true,'NOT NULL','${DTypeDbName}','id','ON UPDATE CASCADE ON DELETE RESTRICT','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableTableId},'name',3,'VARCHAR',true,'NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableTableId},'description',4,'VARCHAR',false,"DEFAULT ''",'','','','','')`, []),

        // field fields
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'id',1,'INTEGER',false,'PRIMARY KEY','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'name',2,'VARCHAR',true,'NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'table_id',3,'INTEGER',true,'NOT NULL','${DTypeTableName}','id','ON UPDATE CASCADE ON DELETE RESTRICT','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'order_index',4,'INTEGER',false,'NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'value_type',5,'VARCHAR',true,'NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'indexed',6,'BOOLEAN',true,'NOT NULL DEFAULT false','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'sql_options',7,'VARCHAR',false,'NOT NULL DEFAULT ''','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'foreign_key_table',8,'VARCHAR',false,"NOT NULL DEFAULT ''",'','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'foreign_key_field',9,'VARCHAR',false,"NOT NULL DEFAULT ''",'','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'foreign_key_sql_options',10,'VARCHAR',false,"NOT NULL DEFAULT ''",'','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'description',11,'TEXT',false,"NOT NULL DEFAULT ''",'','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableFieldsId},'permissions',12,'VARCHAR',false,"NOT NULL DEFAULT ''",'','','','','')`, []),
    ]
    batchReq = new MsgExecuteBatchRequest(DTypeConnection, queryBatch)
    respBatch = sqlw.BatchAtomic(batchReq);
    if (respBatch.error != "") {
        revert(`could not insert table field definitions: ${respBatch.error}`)
    }

    return new ArrayBuffer(0)
}

export function Connect(req: ConnectRequest): ArrayBuffer {
    let conn: DTypeDbConnection | null = null;
    if (req.id > 0) {
        conn = getDbConnection(req.id);
    } else if (req.name != "") {
        conn = getDbConnectionByName(req.name)
    }
    if (conn == null) {
        revert(`no connection identifier provided`);
        return new ArrayBuffer(0);
    }
    const resp = sqlw.Connect(new MsgConnectRequest(conn.driver, conn.connection, conn.name))
    return String.UTF8.encode(JSON.stringify<MsgConnectResponse>(resp))
}

export function Close(req: CloseRequest): ArrayBuffer {
    let conn: DTypeDbConnection | null = null;
    if (req.id > 0) {
        conn = getDbConnection(req.id);
    } else if (req.name != "") {
        conn = getDbConnectionByName(req.name)
    }
    if (conn == null) {
        revert(`no connection identifier provided`);
        return new ArrayBuffer(0);
    }
    const resp = sqlw.Close(new MsgCloseRequest(conn.name))
    return String.UTF8.encode(JSON.stringify<MsgCloseResponse>(resp))
}

export function CreateTable(req: CreateTableRequest): ArrayBuffer {
    const tablerow = getTable(req.table_id)
    const fields = getTableFields(req.table_id);
    const dbrow = getDb(tablerow.db_id);
    const connrow = getDbConnection(dbrow.id);
    const queryDefs: string[] = []
    const indexes: SqlExecuteCommand[] = []
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i]

        // author_id INTEGER REFERENCES authors(id) ON DELETE CASCADE ON UPDATE CASCADE
        let fieldDef = `${field.name} ${field.value_type}`
        if (field.sql_options != "") {
            fieldDef += ` ${field.sql_options}`
        }
        const hasForeignKey = field.foreign_key_table != "" && field.foreign_key_field != "" && field.foreign_key_sql_options != ""
        const nonEmpty = field.foreign_key_table != "" || field.foreign_key_field != "" || field.foreign_key_sql_options != ""

        if (!hasForeignKey && nonEmpty) {
            revert(`foreign key definition invalid for table id ${req.table_id}`)
        }
        if (hasForeignKey) {
            // check table & field names are valid
            const foreignTable = getTableByName(field.foreign_key_table, tablerow.db_id)
            const foreignField = getFieldByName(field.foreign_key_field, foreignTable.id)
            fieldDef += ` REFERENCES ${field.foreign_key_table}(${field.foreign_key_field}) ${field.foreign_key_sql_options}`
        }
        queryDefs.push(fieldDef)
        if (field.indexed) {
            indexes.push(new SqlExecuteCommand(`CREATE INDEX IF NOT EXISTS idx_${tablerow.name}_${field.name} ON ${tablerow.name}(${field.name})`, []),)
        }
    }

    const queryBatch = [
        new SqlExecuteCommand(`CREATE TABLE IF NOT EXISTS ${tablerow.name} (${queryDefs.join(",")})`, []),
    ].concat(indexes)
    const batchReq = new MsgExecuteBatchRequest(connrow.name, queryBatch)
    const respBatch = sqlw.BatchAtomic(batchReq);
    if (respBatch.error != "") {
        revert(`could not create table and indexes: ${respBatch.error}`)
    }
    return String.UTF8.encode(JSON.stringify<MsgExecuteBatchResponse>(respBatch))
}

export function Insert(req: InsertRequest): ArrayBuffer {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id);
    const params = jsonToQueryParams(base64ToString(req.data), fields)

    const values: string[] = []
    for (let i = 0; i < params.keys.length; i++) {
        values.push("?")
    }

    // if we need to use another database
    // (`ATTACH DATABASE ? AS ?`, otherFilePath, aliasName)
    const query = `INSERT INTO ${identif.table_name}(${params.keys}) VALUES (${values.join(",")})`;
    const resp = sqlw.Execute(new MsgExecuteRequest(identif.db_connection_name, query, params.values))
    return String.UTF8.encode(JSON.stringify<MsgExecuteResponse>(resp))
}

export function InsertOrReplace(req: InsertRequest): ArrayBuffer {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id);
    const params = jsonToQueryParams(base64ToString(req.data), fields)

    const values: string[] = []
    for (let i = 0; i < params.keys.length; i++) {
        values.push("?")
    }

    // if we need to use another database
    // (`ATTACH DATABASE ? AS ?`, otherFilePath, aliasName)
    const query = `INSERT OR REPLACE INTO ${identif.table_name}(${params.keys}) VALUES (${values.join(",")})`;
    const resp = sqlw.Execute(new MsgExecuteRequest(identif.db_connection_name, query, params.values))
    return String.UTF8.encode(JSON.stringify<MsgExecuteResponse>(resp))
}

export function Update(req: UpdateRequest): ArrayBuffer {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id);
    const condition = jsonToQueryParams(base64ToString(req.condition), fields)
    const params = jsonToQueryParams(base64ToString(req.data), fields)

    // TODO now we just use AND for conditions
    // conditions can be more complex
    const condvalues: string[] = []
    for (let i = 0; i < condition.keys.length; i++) {
        const key = condition.keys[i]
        condvalues.push(`${key} = ?`)
    }

    const values: string[] = []
    for (let i = 0; i < params.keys.length; i++) {
        const key = params.keys[i]
        values.push(`${key} = ?`)
    }

    let cond = "1"
    if (condvalues.length > 0) {
        cond = condvalues.join(" AND ")
    }

    const query = `UPDATE ${identif.table_name} SET ${values.join(",")} WHERE ${cond};`;
    const resp = sqlw.Execute(new MsgExecuteRequest(identif.db_connection_name, query, params.values.concat(condition.values)))
    return String.UTF8.encode(JSON.stringify<MsgExecuteResponse>(resp))
}

export function Delete(req: DeleteRequest): ArrayBuffer {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id);
    const condition = jsonToQueryParams(base64ToString(req.condition), fields)

    // TODO now we just use AND for conditions
    // conditions can be more complex
    const condvalues: string[] = []
    for (let i = 0; i < condition.keys.length; i++) {
        const key = condition.keys[i]
        condvalues.push(`${key} = ?`)
    }

    let cond = "1"
    if (condvalues.length > 0) {
        cond = condvalues.join(" AND ")
    }

    const query = `DELETE FROM ${identif.table_name} WHERE ${cond};`;
    const resp = sqlw.Execute(new MsgExecuteRequest(identif.db_connection_name, query, condition.values))
    return String.UTF8.encode(JSON.stringify<MsgExecuteResponse>(resp))
}

export function Read(req: ReadRequest): ArrayBuffer {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id);
    const params = jsonToQueryParams(base64ToString(req.data), fields)

    const values: string[] = []
    for (let i = 0; i < params.keys.length; i++) {
        const key = params.keys[i]
        values.push(`${key} = ?`)
    }

    let cond = "1"
    if (values.length > 0) {
        cond = values.join(",")
    }
    // TODO more complex queries - limit, etc.

    const query = `SELECT * FROM ${identif.table_name} WHERE ${cond};`;
    const resp = sqlw.Query(new MsgQueryRequest(identif.db_connection_name, query, params.values))
    return String.UTF8.encode(JSON.stringify<MsgQueryResponse>(resp))
}

export function BuildSchema(req: BuildSchemaRequest): ArrayBuffer {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id);
    const resp = generateJsonSchema(fields)
    return String.UTF8.encode(JSON.stringify<BuildSchemaResponse>(new BuildSchemaResponse(stringToBase64(resp))))
}

function prepareBatchAtomic(id: string, cmmds: string[]): MsgExecuteBatchRequest {
    const commands: SqlExecuteCommand[] = [];
    for (let i = 0; i < cmmds.length; i++) {
        commands.push(new SqlExecuteCommand(cmmds[i], []));
    }
    return new MsgExecuteBatchRequest(id, commands)
}

function joinPath(dir: string, filename: string): string {
    if (dir == "") return filename;
    let lastndx = dir.length;
    for (let i = dir.length - 1; i >= 0; i--) {
        if (dir.charAt(i) == "/") {
            lastndx = i;
        } else {
            break;
        }
    }
    // lastndx is exclusive;
    return dir.substring(0, lastndx) + "/" + filename;
}

function getIdentifier(identif: TableIndentifier): TableIndentifierRequired {
    let conn_name = identif.db_connection_name;
    let db_name = identif.db_name;
    let db_id = identif.db_id;
    let table_name = identif.table_name;
    let table_id = identif.table_id;
    if (conn_name == "") {
        if (identif.db_connection_id > 0) {
            conn_name = getDbConnectionName(identif.db_connection_id);
        } else if (identif.db_id) {
            const dbrow = getDb(identif.db_id);
            conn_name = getDbConnectionName(dbrow.connection_id);
            if (db_name == "") {
                db_name = dbrow.name;
                db_id = dbrow.id;
            }
        }
    }
    if (db_name == "") {
        if (identif.db_id > 0) {
            const dbrow = getDb(identif.db_id);
            db_name = dbrow.name;
            if (conn_name == "") {
                conn_name = getDbConnectionName(dbrow.connection_id);
            }
        }
    }
    if (table_name == "") {
        if (identif.table_id > 0) {
            const tablerow = getTable(identif.table_id);
            table_name = tablerow.name;
            if (db_name == "") {
                const dbrow = getDb(tablerow.db_id);
                db_name = dbrow.name;
                db_id = dbrow.id;
                if (conn_name == "") {
                    conn_name = getDbConnectionName(dbrow.connection_id);
                }
            }
        }
    }
    if (db_id == 0 && db_name != "") {
        const dbrow = getDbByName(db_name)
        db_id = dbrow.id;
    }
    if (table_id == 0 && table_name != "" && db_id > 0) {
        const tablerow = getTableByName(identif.table_name, db_id);
        table_id = tablerow.id
    }

    if (conn_name == "") revert(`could not determine connection name`)
    if (db_name == "") revert(`could not determine db name`)
    if (table_name == "") revert(`could not determine table name`)
    if (db_id == 0) revert(`could not determine db id`)
    if (table_id == 0) revert(`could not determine table id`)
    return new TableIndentifierRequired(db_id, table_id, conn_name, db_name, table_name)
}

function getDbConnection(db_connection_id: i64): DTypeDbConnection {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeDbConnName} WHERE id = ${db_connection_id}`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    const rows = JSON.parse<DTypeDbConnection[]>(base64ToString(queryResp.data))
    if (rows.length != 1) {
        revert(`db connection not found: ${db_connection_id}`);
    }
    return rows[0];
}

function getDbConnectionByName(name: string): DTypeDbConnection {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeDbConnName} WHERE name = '${name}'`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    const rows = JSON.parse<DTypeDbConnection[]>(base64ToString(queryResp.data))
    if (rows.length != 1) {
        revert(`db connection not found: ${name}`);
    }
    return rows[0];
}

function getDbConnectionName(db_connection_id: i64): string {
    const row = getDbConnection(db_connection_id)
    return row.name;
}

function getDb(db_id: i64): DTypeDb {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeDbName} WHERE id = ${db_id}`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    const rows = JSON.parse<DTypeDb[]>(base64ToString(queryResp.data))
    if (rows.length != 1) {
        revert(`db not found: ${db_id}`);
    }
    return rows[0];
}

function getDbByName(name: string): DTypeDb {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeDbName} WHERE name = '${name}'`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    const rows = JSON.parse<DTypeDb[]>(base64ToString(queryResp.data))
    if (rows.length != 1) {
        revert(`db not found: ${name}`);
    }
    return rows[0];
}

function getTable(id: i64): DTypeTable {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeTableName} WHERE id = ${id}`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    const rows = JSON.parse<DTypeTable[]>(base64ToString(queryResp.data))
    if (rows.length != 1) {
        revert(`table not found: ${id}`);
    }
    return rows[0];
}

function getTableByName(name: string, db_id: i64): DTypeTable {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeTableName} WHERE name = '${name}' AND db_id = ${db_id}`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    const rows = JSON.parse<DTypeTable[]>(base64ToString(queryResp.data))
    if (rows.length != 1) {
        revert(`table not found: ${name}, ${db_id}`);
    }
    return rows[0];
}

function getFieldByName(name: string, table_id: i64): DTypeField {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeFieldName} WHERE name = '${name}' AND table_id = ${table_id}`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    const rows = JSON.parse<DTypeField[]>(base64ToString(queryResp.data))
    if (rows.length != 1) {
        revert(`field not found: ${name}, ${table_id}`);
    }
    return rows[0];
}

function getTableFields(id: i64): DTypeField[] {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeFieldName} WHERE table_id = ${id}`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    return JSON.parse<DTypeField[]>(base64ToString(queryResp.data))
}
