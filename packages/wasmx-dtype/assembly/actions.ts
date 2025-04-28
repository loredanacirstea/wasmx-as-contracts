import { JSON } from "json-as/assembly";
import * as sqlw from "wasmx-env-sql/assembly/sql_wrap";
import { base64ToString, stringToBase64, stringToBytes } from "wasmx-utils/assembly/utils";
import { MsgConnectRequest, MsgConnectResponse, MsgExecuteBatchRequest, MsgExecuteBatchResponse, MsgExecuteRequest, MsgExecuteResponse, MsgQueryRequest, MsgQueryResponse, SqlExecuteCommand } from "wasmx-env-sql/assembly/types";
import { CallDataInstantiate, ConnectRequest, CreateTableRequest, DTypeDb, DTypeDbConnection, DTypeField, DTypeTable, InsertRequest, MODULE_NAME, ReadRequest, UpdateRequest } from "./types";
import { revert } from "./utils";
import { jsonToQueryParams } from "./json";
import { Base64String } from "wasmx-env/assembly/types";

const DTypeConnection = "dtype_connection"
const DTypeDbName = "dtype_db"
const DTypeDbConnName = "dtype_db_connection"
const DTypeTableName = "dtype_table"
const DTypeFieldName = "dtype_field"

const SqlCreateTableDbConn = `CREATE TABLE IF NOT EXISTS ${DTypeDbConnName} (id INTEGER PRIMARY KEY, connection VARCHAR, driver VARCHAR, name VARCHAR)`
const SqlCreateIndexDbConn1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbConnName}_name ON ${DTypeDbConnName}(name)`
const SqlCreateIndexDbConn2 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbConnName}_driver ON ${DTypeDbConnName}(driver)`
const SqlCreateTableDb = `CREATE TABLE IF NOT EXISTS ${DTypeDbName} (id INTEGER PRIMARY KEY, name VARCHAR, connection_id INTEGER)`
const SqlCreateIndexDb1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbName}_connection_id ON ${DTypeDbName}(connection_id)`
const SqlCreateIndexDb2 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbName}_name ON ${DTypeDbName}(name)`
const SqlCreateTableTable = `CREATE TABLE IF NOT EXISTS ${DTypeTableName} (id INTEGER PRIMARY KEY, name VARCHAR, db_id INTEGER)`
const SqlCreateIndexTable1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeTableName}_db_id ON ${DTypeTableName}(db_id)`
const SqlCreateIndexTable2 = `CREATE INDEX IF NOT EXISTS idx_${DTypeTableName}_name ON ${DTypeTableName}(name)`
const SqlCreateTableField = `CREATE TABLE IF NOT EXISTS ${DTypeFieldName} (id INTEGER PRIMARY KEY, name VARCHAR, table_id INTEGER, order_index INTEGER, value_type VARCHAR, indexed BOOLEAN, permissions VARCHAR)`
const SqlCreateIndexField1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeFieldName}_table_id ON ${DTypeFieldName}(table_id)`
const SqlCreateIndexField2 = `CREATE INDEX IF NOT EXISTS idx_${DTypeFieldName}_name ON ${DTypeFieldName}(name)`
const SqlCreateIndexField3 = `CREATE INDEX IF NOT EXISTS idx_${DTypeFieldName}_value_type ON ${DTypeFieldName}(value_type)`

export function InstantiateDType(req: CallDataInstantiate): ArrayBuffer {
    const dbfile = "dtype.db"
    const dbpath = joinPath(req.dir, dbfile)

    // TODO index names

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
        revert(`could not insert table fields: ${respBatch.error}`)
    }

    // insert rows
    let query: string;
    query = `INSERT OR REPLACE INTO ${DTypeDbConnName}(connection,driver,name) VALUES ("${dbpath}","${req.driver}","${DTypeConnection}")`;
    createTable = new MsgExecuteRequest(DTypeConnection, query, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not insert table row: ${respexec.error}`)
    }

    query = `INSERT OR REPLACE INTO ${DTypeDbName}(connection_id,name) VALUES (${respexec.last_insert_id},"dtype")`;
    createTable = new MsgExecuteRequest(DTypeConnection, query, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not insert table row: ${respexec.error}`)
    }

    query = `INSERT OR REPLACE INTO ${DTypeTableName}(name,db_id) VALUES ("${DTypeTableName}",1)`;
    createTable = new MsgExecuteRequest(DTypeConnection, query, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not insert table row: ${respexec.error}`)
    }

    queryBatch = [
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,permissions) VALUES (${respexec.last_insert_id},"id",1,"INTEGER",false,"")`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,permissions) VALUES (${respexec.last_insert_id},"db_id",2,"INTEGER",true,"")`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,permissions) VALUES (${respexec.last_insert_id},"name",3,"VARCHAR",true,"")`, []),
    ]
    batchReq = new MsgExecuteBatchRequest(DTypeConnection, queryBatch)
    respBatch = sqlw.BatchAtomic(batchReq);
    if (respBatch.error != "") {
        revert(`could not insert table fields: ${respBatch.error}`)
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

export function CreateTable(req: CreateTableRequest): ArrayBuffer {
    const tablerow = getTable(req.table_id)
    console.log("--CreateTable tablerow--" + tablerow.name)
    const fields = getTableFields(req.table_id);
    console.log("--CreateTable fields--" + fields.length.toString())
    const dbrow = getDb(tablerow.db_id);
    const connrow = getDbConnection(dbrow.id);
    const queryDefs: string[] = []
    const indexes: SqlExecuteCommand[] = []
    for (let i = 0; i < fields.length; i++) {
        queryDefs.push(`${fields[i].name} ${fields[i].value_type}`)
        if (fields[i].indexed) {
            indexes.push(new SqlExecuteCommand(`CREATE INDEX IF NOT EXISTS idx_${tablerow.name}_${fields[i].name} ON ${tablerow.name}(${fields[i].name})`, []),)
        }
    }

    const queryBatch = [
        new SqlExecuteCommand(`CREATE TABLE IF NOT EXISTS ${tablerow.name} (id INTEGER PRIMARY KEY, ${queryDefs.join(",")})`, []),
    ].concat(indexes)
    const batchReq = new MsgExecuteBatchRequest(connrow.name, queryBatch)
    const respBatch = sqlw.BatchAtomic(batchReq);
    if (respBatch.error != "") {
        revert(`could not insert table fields: ${respBatch.error}`)
    }
    return String.UTF8.encode(JSON.stringify<MsgExecuteBatchResponse>(respBatch))
}

export function Insert(req: InsertRequest): ArrayBuffer {
    let conn_name = req.db_connection_name;
    let db_name = req.db_name;
    let table_name = req.table_name;
    if (conn_name == "") {
        if (req.db_connection_id > 0) {
            conn_name = getDbConnectionName(req.db_connection_id);
        } else if (req.db_id) {
            const dbrow = getDb(req.db_id);
            conn_name = getDbConnectionName(dbrow.connection_id);
            if (db_name == "") db_name = dbrow.name;
        }
    }
    if (db_name == "") {
        if (req.db_id > 0) {
            const dbrow = getDb(req.db_id);
            db_name = dbrow.name;
            if (conn_name == "") {
                conn_name = getDbConnectionName(dbrow.connection_id);
            }
        }
    }
    if (table_name == "") {
        if (req.table_id > 0) {
            const tablerow = getTable(req.table_id);
            table_name = tablerow.name;
            if (db_name == "") {
                const dbrow = getDb(tablerow.db_id);
                db_name = dbrow.name;
                if (conn_name == "") {
                    conn_name = getDbConnectionName(dbrow.connection_id);
                }
            }
        }
    }

    if (conn_name == "") revert(`could not determine connection name`)
    if (db_name == "") revert(`could not determine db name`)
    if (table_name == "") revert(`could not determine table name`)

    // const encodedRows = sqlw.Query(new MsgQueryRequest(conn_name, `SELECT name FROM ${db_name} WHERE id = ${req.table_id}`, []))
    // console.log("--tableRow--" + encodedRows.error + "--" + encodedRows.data)
    // if (encodedRows.error != "") {
    //     revert(`insert failed: ${encodedRows.error}`);
    // }
    // // tableRow.data base64 encoded rows
    // const tableRow = JSON.parse<>(base64ToString(encodedRows.data))

    const params = jsonToQueryParams(base64ToString(req.data))

    const values: string[] = []
    for (let i = 0; i < params.keys.length; i++) {
        values.push("?")
    }

    // if we need to use another database
    // (`ATTACH DATABASE ? AS ?`, otherFilePath, aliasName)
    const query = `INSERT OR REPLACE INTO ${table_name}(${params.keys}) VALUES (${values.join(",")})`;
    const resp = sqlw.Execute(new MsgExecuteRequest(conn_name, query, params.values))
    return String.UTF8.encode(JSON.stringify<MsgExecuteResponse>(resp))
}

export function Update(req: UpdateRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function Read(req: ReadRequest): ArrayBuffer {
    return new ArrayBuffer(0)
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
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeDbConnName} WHERE name = "${name}"`, []))
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

function getTable(id: i64): DTypeTable {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeTableName} WHERE id = ${id}`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    console.log("--getTable--" + id.toString() + "--" + base64ToString(queryResp.data))
    const rows = JSON.parse<DTypeTable[]>(base64ToString(queryResp.data))
    console.log("-getTable-" + rows.length.toString())
    if (rows.length != 1) {
        revert(`table not found: ${id}`);
    }
    console.log("-getTableYES-")
    return rows[0];
}

function getTableFields(id: i64): DTypeField[] {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeFieldName} WHERE table_id = ${id}`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    return JSON.parse<DTypeField[]>(base64ToString(queryResp.data))
}
