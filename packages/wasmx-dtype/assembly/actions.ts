import { JSON } from "json-as/assembly";
import { JSON as JSONDyn } from "assemblyscript-json/assembly";
import * as sqlw from "wasmx-env-sql/assembly/sql_wrap";
import { base64ToString, stringToBase64, stringToBytes } from "wasmx-utils/assembly/utils";
import { MsgCloseRequest, MsgCloseResponse, MsgConnectRequest, MsgConnectResponse, MsgExecuteBatchRequest, MsgExecuteBatchResponse, MsgExecuteRequest, MsgExecuteResponse, MsgQueryRequest, MsgQueryResponse, SqlExecuteCommand } from "wasmx-env-sql/assembly/types";
import { BuildSchemaRequest, BuildSchemaResponse, CallDataInstantiate, CallDataInstantiateTokens, CloseRequest, ConnectRequest, CountRequest, CountResponse, CreateTableRequest, DeleteRequest, DTypeDb, DTypeDbConnection, DTypeField, DTypeTable, InsertRequest, MODULE_NAME, ReadFieldRequest, ReadRequest, TableIndentifier, TableIndentifierRequired, UpdateRequest } from "./types";
import { revert } from "./utils";
import { jsonToQueryParams, QueryParams } from "./json";
import { generateJsonSchema } from "./schema";
import { DTypeConnection, DTypeDbConnName, DTypeDbName, DTypeFieldName, DTypeNodeName, DTypeRelationName, DTypeRelationTypeName, DTypeTableName, OwnedTable, OwnedTableId, PermissionsTable, PermissionsTableId, tableDbConnId, tableDbId, tableFieldsId, tableNodeId, tableRelationId, tableRelationTypeId, tableTableId, TokensTable, TokensTableId } from "./config";
import { AddRequest, MoveRequest, SubRequest } from "./types_tokens";
import { BigInt } from "wasmx-env/assembly/bn";
import { Base64String } from "wasmx-env/assembly/types";

// TODO each table has field creator: Bech32String (contract address with write rights)

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

const SqlCreateNode = `CREATE TABLE ${DTypeNodeName} (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER REFERENCES ${DTypeTableName}(id),
    record_id INTEGER,
    name TEXT
);`
const SqlCreateRelation = `CREATE TABLE ${DTypeRelationName} (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    relation_type_id INTEGER REFERENCES ${DTypeRelationTypeName}(id),
    source_node_id INTEGER REFERENCES ${DTypeNodeName}(id),
    target_node_id INTEGER REFERENCES ${DTypeNodeName}(id),
    order_index INTEGER DEFAULT 0
);`
const SqlCreateRelationType = `CREATE TABLE ${DTypeRelationTypeName} (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name VARCHAR,
    reverse_name VARCHAR,
    reversable BOOLEAN DEFAULT true
);`
const SqlCreateIndexRelation1 = `CREATE INDEX relation_source_node_id_IDX ON relation (source_node_id);`
const SqlCreateIndexRelation2 = `CREATE INDEX relation_target_node_id_IDX ON relation (target_node_id);`

const GraphTables = `[{"name":"${DTypeNodeName}","db_id":"1","description":"table for graph nodes"},{"name":"${DTypeNodeName}","db_id":"1","description":"table for graph nodes"}]`


const AssetTables = `[{"name":"${TokensTable}","db_id":"1","description":"table for registered tokens"},{"name":"${OwnedTable}","db_id":"1","description":"table for user owned tokens"},{"name":"${PermissionsTable}","db_id":"1","description":"table for asset permissions"}]`
const TokenFields = `[
{"table_id":${TokensTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"value_type","order_index":2,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"name","order_index":3,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"symbol","order_index":4,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"decimals","order_index":5,"value_type":"INTEGER","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"address","order_index":6,"value_type":"VARCHAR","indexed":true,"sql_options":"UNIQUE NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"total_supply","order_index":7,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"actions","order_index":8,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT '[]'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"actions_user","order_index":9,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT '[]'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`
// TODO combine table_id, record_id for index
const OwnedFields = `[
{"table_id":${OwnedTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"table_id","order_index":2,"value_type":"INTEGER","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"${DTypeTableName}","foreign_key_field":"id","foreign_key_sql_options":"ON UPDATE CASCADE ON DELETE RESTRICT","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"record_id","order_index":3,"value_type":"INTEGER","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"amount","order_index":4,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"fungible","order_index":5,"value_type":"BOOLEAN","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"permissions","order_index":6,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT '[]'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"creator","order_index":7,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"owner","order_index":8,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`

const PermissionFields = `[
{"table_id":${PermissionsTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${PermissionsTableId},"name":"table_id","order_index":2,"value_type":"INTEGER","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"${DTypeTableName}","foreign_key_field":"id","foreign_key_sql_options":"ON UPDATE CASCADE ON DELETE RESTRICT","description":"","permissions":""},
{"table_id":${PermissionsTableId},"name":"record_id","order_index":3,"value_type":"INTEGER","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${PermissionsTableId},"name":"owner","order_index":4,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${PermissionsTableId},"name":"spender","order_index":5,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${PermissionsTableId},"name":"owned","order_index":6,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${PermissionsTableId},"name":"amount","order_index":7,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`

export function InstantiateDType(req: CallDataInstantiate): ArrayBuffer {
    console.log("--InstantiateDType--")
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

    // graph tables
    createTable = new MsgExecuteRequest(DTypeConnection, SqlCreateNode, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not create node table: ${respexec.error}`)
    }

    createTable = new MsgExecuteRequest(DTypeConnection, SqlCreateRelation, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not create relation table: ${respexec.error}`)
    }

    createTable = new MsgExecuteRequest(DTypeConnection, SqlCreateRelationType, [])
    respexec = sqlw.Execute(createTable);
    if (respexec.error != "") {
        revert(`could not create relation type table: ${respexec.error}`)
    }

    // create indexes
    queryBatch = [
        new SqlExecuteCommand(SqlCreateIndexRelation1, []),
        new SqlExecuteCommand(SqlCreateIndexRelation2, []),
    ]
    batchReq = new MsgExecuteBatchRequest(DTypeConnection, queryBatch)
    respBatch = sqlw.BatchAtomic(batchReq);
    if (respBatch.error != "") {
        revert(`could not create graph tables indexes: ${respBatch.error}`)
    }

    // insert graph table definitions
    // TODO use jsons and call Insert & CreateTable (GraphTables)
    queryBatch = [
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeTableName}(name,db_id,description) VALUES ('${DTypeNodeName}',1,'table for graph nodes')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeTableName}(name,db_id,description) VALUES ('${DTypeRelationName}',1,'table for graph relation')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeTableName}(name,db_id,description) VALUES ('${DTypeRelationTypeName}',1,'table for graph relation types')`, []),
    ]
    batchReq = new MsgExecuteBatchRequest(DTypeConnection, queryBatch)
    respBatch = sqlw.BatchAtomic(batchReq);
    if (respBatch.error != "") {
        revert(`could not insert tables: ${respBatch.error}`)
    }

    // insert graph table fields
    queryBatch = [
        // node table
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableNodeId},'id',1,'INTEGER',false,'PRIMARY KEY','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableNodeId},'table_id',2,'INTEGER',true,'NOT NULL','${DTypeTableName}','id','ON UPDATE CASCADE ON DELETE RESTRICT','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableNodeId},'record_id',3,'INTEGER',true,'NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableNodeId},'name',4,'VARCHAR',false,'NOT NULL','','','','','')`, []),

        // relation table
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableRelationId},'id',1,'INTEGER',false,'PRIMARY KEY','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableRelationId},'relation_type_id',2,'INTEGER',true,'NOT NULL','${DTypeRelationTypeName}','id','ON UPDATE CASCADE ON DELETE RESTRICT','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableRelationId},'source_node_id',3,'INTEGER',true,'NOT NULL','${DTypeNodeName}','id','ON UPDATE CASCADE ON DELETE RESTRICT','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableRelationId},'target_node_id',4,'INTEGER',true,'NOT NULL','${DTypeNodeName}','id','ON UPDATE CASCADE ON DELETE RESTRICT','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableRelationId},'order_index',5,'INTEGER',false,'NOT NULL DEFAULT 0','','','','','')`, []),

        // relation type table
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableRelationTypeId},'id',1,'INTEGER',false,'PRIMARY KEY','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableRelationTypeId},'name',2,'VARCHAR',false,'NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableRelationTypeId},'reverse_name',3,'VARCHAR',false,'NOT NULL','','','','','')`, []),
        new SqlExecuteCommand(`INSERT OR REPLACE INTO ${DTypeFieldName}(table_id,name,order_index,value_type,indexed,sql_options,foreign_key_table,foreign_key_field,foreign_key_sql_options,description,permissions) VALUES (${tableRelationTypeId},'reversable',4,'BOOLEAN',true,'NOT NULL DEFAULT true','','','','','')`, []),
    ]
    batchReq = new MsgExecuteBatchRequest(DTypeConnection, queryBatch)
    respBatch = sqlw.BatchAtomic(batchReq);
    if (respBatch.error != "") {
        revert(`could not insert table field definitions: ${respBatch.error}`)
    }
    return new ArrayBuffer(0)
}

export function InstantiateTokens(req: CallDataInstantiateTokens): ArrayBuffer {
    console.log("--InstantiateDType token & owned--")

    // Create token & owned tables
    const identif = new TableIndentifier(tableDbConnId, tableDbId, tableTableId, DTypeConnection, DTypeDbName, DTypeTableName)
    let respBatch = InsertOrReplaceInternal(identif, AssetTables)
    if (respBatch.error != "") {
        revert(`could not insert token table definitions: ${respBatch.error}`)
    }
    identif.table_id = tableFieldsId
    identif.table_name = DTypeFieldName
    respBatch = InsertOrReplaceInternal(identif, TokenFields)
    if (respBatch.error != "") {
        revert(`could not insert token fields definitions: ${respBatch.error}`)
    }
    respBatch = InsertOrReplaceInternal(identif, OwnedFields)
    if (respBatch.error != "") {
        revert(`could not insert owned fields definitions: ${respBatch.error}`)
    }
    respBatch = InsertOrReplaceInternal(identif, PermissionFields)
    if (respBatch.error != "") {
        revert(`could not insert permission fields definitions: ${respBatch.error}`)
    }

    let resp = CreateTableInternal(new CreateTableRequest(TokensTableId))
    if (resp.error != "") {
        revert(`could not create tokens table: ${resp.error}`)
    }
    resp = CreateTableInternal(new CreateTableRequest(OwnedTableId))
    if (resp.error != "") {
        revert(`could not create owned table: ${resp.error}`)
    }
    resp = CreateTableInternal(new CreateTableRequest(PermissionsTableId))
    if (resp.error != "") {
        revert(`could not create permissions table: ${resp.error}`)
    }

    console.log("--InstantiateDType token & owned END--")

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
    const respBatch = CreateTableInternal(req)
    return String.UTF8.encode(JSON.stringify<MsgExecuteBatchResponse>(respBatch))
}

export function CreateTableInternal(req: CreateTableRequest): MsgExecuteBatchResponse {
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
    return respBatch
}

export function Insert(req: InsertRequest): ArrayBuffer {
    const resp = InsertInternal(req)
    return String.UTF8.encode(JSON.stringify<MsgExecuteBatchResponse>(resp))
}

export function InsertOrReplace(req: InsertRequest): ArrayBuffer {
    const resp = InsertOrReplaceInternal(req.identifier, base64ToString(req.data))
    return String.UTF8.encode(JSON.stringify<MsgExecuteBatchResponse>(resp))
}

export function Update(req: UpdateRequest): ArrayBuffer {
    const resp = UpdateInternal(req)
    return String.UTF8.encode(JSON.stringify<MsgExecuteBatchResponse>(resp))
}

export function Delete(req: DeleteRequest): ArrayBuffer {
    const resp = DeleteInternal(req)
    return String.UTF8.encode(JSON.stringify<MsgExecuteBatchResponse>(resp))
}

export function Read(req: ReadRequest): ArrayBuffer {
    const resp = ReadInternal(req.identifier, req.data)
    return String.UTF8.encode(JSON.stringify<MsgQueryResponse>(resp))
}

export function ReadField(req: ReadFieldRequest): ArrayBuffer {
    const resp = ReadFieldInternal(req)
    return String.UTF8.encode(JSON.stringify<MsgQueryResponse>(resp))
}

export function Count(req: CountRequest): ArrayBuffer {
    const resp = ReadInternal(req.identifier, req.data)
    if (resp.error != "") {
        return String.UTF8.encode(JSON.stringify<CountResponse>(new CountResponse(resp.error, 0)))
    }
    console.log("count--" + resp.data)
    const data = base64ToString(resp.data)
    let arr: JSONDyn.Arr = <JSONDyn.Arr>(JSONDyn.parse(data));
    console.log("count--" + arr._arr.length.toString())
    return String.UTF8.encode(JSON.stringify<CountResponse>(new CountResponse("", i64(arr._arr.length))))
}

export function BuildSchema(req: BuildSchemaRequest): ArrayBuffer {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id);
    if (fields.length == 0) revert(`table with no fields`)
    const resp = generateJsonSchema(fields)
    return String.UTF8.encode(JSON.stringify<BuildSchemaResponse>(new BuildSchemaResponse(stringToBase64(resp))))
}

export function add(req: AddRequest): ArrayBuffer {
    const data = ReadFieldInternal(new ReadFieldRequest(req.identifier, 0, req.fieldName, req.condition))
    const amount = BigInt.fromString(req.amount)
    let value = BigInt.zero()
    console.log("--add--" + data.data + "--" + base64ToString(data.data))
    if (data.data != "") {
        value = BigInt.fromString(base64ToString(data.data))
    }
    console.log("--add value--" + value.toString())
    value = value.add(amount)
    console.log("--add value--" + req.fieldName + "---" + value.toString())
    const resp = UpdateInternal(new UpdateRequest(req.identifier, req.condition, stringToBase64(`{"${req.fieldName}":"${value.toString()}"}`)))
    if (resp.error != "") {
        revert(resp.error)
    }
    return new ArrayBuffer(0)
}

export function sub(req: SubRequest): ArrayBuffer {
    const data = ReadFieldInternal(new ReadFieldRequest(req.identifier, 0, req.fieldName, req.condition))
    const amount = BigInt.fromString(req.amount)
    let value = BigInt.zero()
    console.log("--sub--" + data.data + "--" + base64ToString(data.data))
    if (data.data != "") {
        value = BigInt.fromString(base64ToString(data.data))
    }
    value = value.sub(amount)
    const resp = UpdateInternal(new UpdateRequest(req.identifier, req.condition, stringToBase64(`{"${req.fieldName}":"${value.toString()}"}`)))
    if (resp.error != "") {
        revert(resp.error)
    }
    return new ArrayBuffer(0)
}

export function move(req: MoveRequest): ArrayBuffer {
    const amount = BigInt.fromString(req.amount)
    const dataSource = ReadFieldInternal(new ReadFieldRequest(req.identifier, 0, req.fieldName, req.condition_source))
    const dataTarget = ReadFieldInternal(new ReadFieldRequest(req.identifier, 0, req.fieldName, req.condition_target))

    console.log("--move dataSource--" + dataSource.data + "--" + base64ToString(dataSource.data))
    console.log("--move dataTarget--" + dataTarget.data + "--" + base64ToString(dataTarget.data))

    let valueSource = BigInt.zero()
    if (dataSource.data != "") {
        valueSource = BigInt.fromString(base64ToString(dataSource.data))
    }
    let valueTarget = BigInt.zero()
    if (dataTarget.data != "") {
        valueTarget = BigInt.fromString(base64ToString(dataTarget.data))
    }

    if (valueSource.lt(amount)) {
        revert(`move source amount not enough`)
    }

    valueSource = valueSource.sub(amount)
    valueTarget = valueTarget.add(amount)

    console.log("--valueSource--" + valueSource.toString())
    console.log("--valueTarget--" + valueTarget.toString())

    // atomic update operation
    const condition = stringToBase64(`[${base64ToString(req.condition_source)},${base64ToString(req.condition_target)}]`)

    const toUpdate = stringToBase64(`[{"${req.fieldName}":"${valueSource.toString()}"},{"${req.fieldName}":"${valueTarget.toString()}"}]`)

    const resp = UpdateInternal(new UpdateRequest(req.identifier, condition, toUpdate))
    if (resp.error != "") {
        revert(resp.error)
    }
    return new ArrayBuffer(0)
}

export function InsertInternal(req: InsertRequest): MsgExecuteBatchResponse {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id);
    if (fields.length == 0) revert(`table with no fields`)
    const params = jsonToQueryParams(base64ToString(req.data), fields)
    if (params.length == 0) return new MsgExecuteBatchResponse("", [])

    const queries: SqlExecuteCommand[] = []
    for (let i = 0; i < params.length; i++) {
        const param = params[i]
        const values: string[] = []
        for (let i = 0; i < param.keys.length; i++) {
            values.push("?")
        }
        // if we need to use another database
        // (`ATTACH DATABASE ? AS ?`, otherFilePath, aliasName)
        const query = `INSERT INTO ${identif.table_name}(${param.keys}) VALUES (${values.join(",")})`;
        queries.push(new SqlExecuteCommand(query, param.values))
    }

    if (queries.length == 1) {
        const resp = sqlw.Execute(new MsgExecuteRequest(identif.db_connection_name, queries[0].query, queries[0].params))
        return new MsgExecuteBatchResponse(resp.error, [resp]);
    }

    return sqlw.BatchAtomic(new MsgExecuteBatchRequest(identif.db_connection_name, queries))
}

export function InsertOrReplaceInternal(identifier: TableIndentifier, data: string): MsgExecuteBatchResponse {
    console.log("--InsertOrReplaceInternal--" + data)

    const identif = getIdentifier(identifier);

    console.log("--InsertOrReplaceInternal identif--" + identif.table_id.toString())

    const fields = getTableFields(identif.table_id);
    console.log("--InsertOrReplaceInternal fields--" + fields.length.toString())
    if (fields.length == 0) revert(`table with no fields`)

    const params = jsonToQueryParams(data, fields)

    console.log("--InsertOrReplaceInternal params--" + params.length.toString())

    if (params.length == 0) return new MsgExecuteBatchResponse("", [])



    const queries: SqlExecuteCommand[] = []
    for (let i = 0; i < params.length; i++) {
        const param = params[i]
        const values: string[] = []
        for (let i = 0; i < param.keys.length; i++) {
            values.push("?")
        }

        // if we need to use another database
        // (`ATTACH DATABASE ? AS ?`, otherFilePath, aliasName)
        const query = `INSERT OR REPLACE INTO ${identif.table_name}(${param.keys}) VALUES (${values.join(",")})`;
        queries.push(new SqlExecuteCommand(query, param.values))
    }

    if (queries.length == 1) {
        const resp = sqlw.Execute(new MsgExecuteRequest(identif.db_connection_name, queries[0].query, queries[0].params))
        return new MsgExecuteBatchResponse(resp.error, [resp]);
    }

    return sqlw.BatchAtomic(new MsgExecuteBatchRequest(identif.db_connection_name, queries))
}

export function UpdateInternal(req: UpdateRequest): MsgExecuteBatchResponse {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id);
    if (fields.length == 0) revert(`table with no fields`)
    const conditions = jsonToQueryParams(base64ToString(req.condition), fields)
    const params = jsonToQueryParams(base64ToString(req.data), fields)

    if (params.length == 0) return new MsgExecuteBatchResponse("", [])
    if (conditions.length != params.length) return new MsgExecuteBatchResponse("condition length mismatch", [])

    const queries: SqlExecuteCommand[] = []
    for (let i = 0; i < params.length; i++) {
        const param = params[i]
        const condition = conditions[i]

        // TODO now we just use AND for conditions
        // conditions can be more complex
        const condvalues: string[] = []
        for (let i = 0; i < condition.keys.length; i++) {
            const key = condition.keys[i]
            condvalues.push(`${key} = ?`)
        }

        const values: string[] = []
        for (let i = 0; i < param.keys.length; i++) {
            const key = param.keys[i]
            values.push(`${key} = ?`)
        }

        let cond = "1"
        if (condvalues.length > 0) {
            cond = condvalues.join(" AND ")
        }

        const query = `UPDATE ${identif.table_name} SET ${values.join(",")} WHERE ${cond};`;
        queries.push(new SqlExecuteCommand(query, param.values.concat(condition.values)))
    }
    if (queries.length == 1) {
        const resp = sqlw.Execute(new MsgExecuteRequest(identif.db_connection_name, queries[0].query, queries[0].params))
        return new MsgExecuteBatchResponse(resp.error, [resp]);
    }

    return sqlw.BatchAtomic(new MsgExecuteBatchRequest(identif.db_connection_name, queries))
}

export function DeleteInternal(req: DeleteRequest): MsgExecuteBatchResponse {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id);
    if (fields.length == 0) revert(`table with no fields`)
    const conditions = jsonToQueryParams(base64ToString(req.condition), fields)

    if (conditions.length == 0) return new MsgExecuteBatchResponse("delete must have a condition", [])

    const queries: SqlExecuteCommand[] = []
    for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i]

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
        queries.push(new SqlExecuteCommand(query, condition.values))
    }

    if (queries.length == 1) {
        const resp = sqlw.Execute(new MsgExecuteRequest(identif.db_connection_name, queries[0].query, queries[0].params))
        return new MsgExecuteBatchResponse(resp.error, [resp]);
    }

    return sqlw.BatchAtomic(new MsgExecuteBatchRequest(identif.db_connection_name, queries))
}

// TODO batch reads
export function ReadInternal(identifier: TableIndentifier, data: Base64String): MsgQueryResponse {
    const identif = getIdentifier(identifier);
    const fields = getTableFields(identif.table_id);
    if (fields.length == 0) revert(`table with no fields`)
    const params = jsonToQueryParams(base64ToString(data), fields)
    if (params.length == 0) return new MsgQueryResponse("", "")
    const param = params[0]

    const values: string[] = []
    for (let i = 0; i < param.keys.length; i++) {
        const key = param.keys[i]
        values.push(`${key} = ?`)
    }

    let cond = "1"
    if (values.length > 0) {
        cond = values.join(" AND ")
    }
    // TODO more complex queries - limit, etc.

    const query = `SELECT * FROM ${identif.table_name} WHERE ${cond};`;
    return sqlw.Query(new MsgQueryRequest(identif.db_connection_name, query, param.values))
}

export function ReadFieldInternal(req: ReadFieldRequest): MsgQueryResponse {
    const identif = getIdentifier(req.identifier);
    const fields = getTableFields(identif.table_id)
    if (req.fieldName == "") {
        revert(`missing field name`);
    }
    let field: DTypeField | null = null;
    for (let i = 0; i < fields.length; i++) {
        if (fields[i].name == req.fieldName) {
            field = fields[i]
        }
    }
    if (field == null) {
        revert(`invalid field name`)
        return new MsgQueryResponse("", "");
    }
    // if (req.fieldId > 0) {
    //     field = getField(req.fieldId)
    // } else {
    //     field = getFieldByName(req.fieldName, identif.table_id)
    // }
    console.log("--ReadFieldInternal--" + base64ToString(req.data))
    const params = jsonToQueryParams(base64ToString(req.data), fields)
    console.log("--ReadFieldInternal params--" + params.length.toString())
    if (params.length == 0) return new MsgQueryResponse("", "")
    const param = params[0]
    console.log("--ReadFieldInternal params--" + param.keys.join(",") + "--" + param.values.join(","))

    const values: string[] = []
    for (let i = 0; i < param.keys.length; i++) {
        const key = param.keys[i]
        values.push(`${key} = ?`)
    }
    console.log("--ReadFieldInternal values--" + values.length.toString())

    let cond = "1"
    if (values.length > 0) {
        cond = values.join(" AND ")
    }

    const query = `SELECT ${field.name} FROM ${identif.table_name} WHERE ${cond};`;
    const resp = sqlw.Query(new MsgQueryRequest(identif.db_connection_name, query, param.values))
    console.log("--ReadFieldInternal q error--" + resp.error)
    console.log("--ReadFieldInternal q data--" + resp.data)
    if (resp.error != "") return new MsgQueryResponse(resp.error, "")

    let jsonObj: JSONDyn.Arr = <JSONDyn.Arr>(JSONDyn.parse(base64ToString(resp.data)));
    if (jsonObj._arr.length > 0) {
        const v = jsonObj._arr.at(0)
        if (!v.isObj) revert("unexpected value")
        const value: JSONDyn.Obj = changetype<JSONDyn.Obj>(v);
        if (value.has(req.fieldName)) {
            const data = value.get(req.fieldName)
            if (data != null) return new MsgQueryResponse("", stringToBase64(data.toString()))
        }
    }

    return new MsgQueryResponse("", "")
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

function getField(fieldId: i64): DTypeField {
    const queryResp = sqlw.Query(new MsgQueryRequest(DTypeConnection, `SELECT * FROM ${DTypeFieldName} WHERE id = ${fieldId}`, []))
    if (queryResp.error != "") {
        revert(`query failed: ${queryResp.error}`);
    }
    const rows = JSON.parse<DTypeField[]>(base64ToString(queryResp.data))
    if (rows.length != 1) {
        revert(`field not found: ${fieldId}`);
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
