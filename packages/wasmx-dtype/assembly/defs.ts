import { DTypeDbConnName, DTypeDbName, DTypeFieldName, DTypeNodeName, DTypeRelationName, DTypeRelationTypeName, DTypeTableName, OwnedTable, OwnedTableId, AllowanceTable, AllowanceTableId, TokensTable, TokensTableId, IdentityTable, FullNameTable, EmailTable, IdentityTableId, FullNameTableId, EmailTableId } from "./config";

// TODO each table has field creator: Bech32String (contract address with write rights)

export const SqlCreateTableDbConn = `CREATE TABLE IF NOT EXISTS ${DTypeDbConnName} (id INTEGER PRIMARY KEY, connection VARCHAR NOT NULL, driver VARCHAR NOT NULL, name VARCHAR UNIQUE NOT NULL, description TEXT DEFAULT '')`
export const SqlCreateIndexDbConn1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbConnName}_name ON ${DTypeDbConnName}(name)`
export const SqlCreateIndexDbConn2 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbConnName}_driver ON ${DTypeDbConnName}(driver)`
export const SqlCreateTableDb = `CREATE TABLE IF NOT EXISTS ${DTypeDbName} (id INTEGER PRIMARY KEY, name VARCHAR UNIQUE NOT NULL, connection_id INTEGER NOT NULL REFERENCES ${DTypeDbConnName}(id) ON UPDATE CASCADE ON DELETE RESTRICT, description TEXT DEFAULT '')`
export const SqlCreateIndexDb1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbName}_connection_id ON ${DTypeDbName}(connection_id)`
export const SqlCreateIndexDb2 = `CREATE INDEX IF NOT EXISTS idx_${DTypeDbName}_name ON ${DTypeDbName}(name)`
export const SqlCreateTableTable = `CREATE TABLE IF NOT EXISTS ${DTypeTableName} (id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, db_id INTEGER NOT NULL REFERENCES ${DTypeDbName}(id) ON UPDATE CASCADE ON DELETE RESTRICT, description TEXT DEFAULT '')`
export const SqlCreateIndexTable1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeTableName}_db_id ON ${DTypeTableName}(db_id)`
export const SqlCreateIndexTable2 = `CREATE UNIQUE INDEX IF NOT EXISTS idx_${DTypeTableName}_dbid_name ON ${DTypeTableName}(db_id,name)`
export const SqlCreateTableField = `CREATE TABLE IF NOT EXISTS ${DTypeFieldName} (id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, table_id INTEGER NOT NULL REFERENCES ${DTypeTableName}(id) ON UPDATE CASCADE ON DELETE RESTRICT, order_index INTEGER NOT NULL, value_type VARCHAR NOT NULL, indexed BOOLEAN NOT NULL DEFAULT false, sql_options VARCHAR NOT NULL DEFAULT '', foreign_key_table VARCHAR NOT NULL DEFAULT '', foreign_key_field VARCHAR NOT NULL DEFAULT '', foreign_key_sql_options VARCHAR NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', permissions VARCHAR NOT NULL DEFAULT '')`
export const SqlCreateIndexField1 = `CREATE INDEX IF NOT EXISTS idx_${DTypeFieldName}_table_id ON ${DTypeFieldName}(table_id)`
export const SqlCreateIndexField2 = `CREATE UNIQUE INDEX IF NOT EXISTS idx_${DTypeFieldName}_tableid_name ON ${DTypeFieldName}(table_id,name)`
export const SqlCreateIndexField3 = `CREATE INDEX IF NOT EXISTS idx_${DTypeFieldName}_value_type ON ${DTypeFieldName}(value_type)`

export const SqlCreateNode = `CREATE TABLE ${DTypeNodeName} (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER REFERENCES ${DTypeTableName}(id),
    record_id INTEGER,
    name TEXT
);`
export const SqlCreateRelation = `CREATE TABLE ${DTypeRelationName} (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    relation_type_id INTEGER REFERENCES ${DTypeRelationTypeName}(id),
    source_node_id INTEGER REFERENCES ${DTypeNodeName}(id),
    target_node_id INTEGER REFERENCES ${DTypeNodeName}(id),
    order_index INTEGER DEFAULT 0
);`
export const SqlCreateRelationType = `CREATE TABLE ${DTypeRelationTypeName} (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name VARCHAR,
    reverse_name VARCHAR,
    reversable BOOLEAN DEFAULT true
);`
export const SqlCreateIndexRelation1 = `CREATE INDEX relation_source_node_id_IDX ON relation (source_node_id);`
export const SqlCreateIndexRelation2 = `CREATE INDEX relation_target_node_id_IDX ON relation (target_node_id);`

export const GraphTables = `[{"name":"${DTypeNodeName}","db_id":"1","description":"table for graph nodes"},{"name":"${DTypeNodeName}","db_id":"1","description":"table for graph nodes"}]`


export const AssetTables = `[{"name":"${TokensTable}","db_id":"1","description":"table for registered tokens"},{"name":"${OwnedTable}","db_id":"1","description":"table for user owned tokens"},{"name":"${AllowanceTable}","db_id":"1","description":"table for asset permissions"}]`
export const TokenFields = `[
{"table_id":${TokensTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"value_type","order_index":2,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"name","order_index":3,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"symbol","order_index":4,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"decimals","order_index":5,"value_type":"INTEGER","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"address","order_index":6,"value_type":"VARCHAR","indexed":true,"sql_options":"UNIQUE NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"total_supply","order_index":7,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"actions","order_index":8,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT '[]'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"actions_user","order_index":9,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT '[]'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${TokensTableId},"name":"fungible","order_index":10,"value_type":"BOOLEAN","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`
// TODO combine table_id, record_id for index
export const OwnedFields = `[
{"table_id":${OwnedTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"table_id","order_index":2,"value_type":"INTEGER","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"${DTypeTableName}","foreign_key_field":"id","foreign_key_sql_options":"ON UPDATE CASCADE ON DELETE RESTRICT","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"record_id","order_index":3,"value_type":"INTEGER","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"amount","order_index":4,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"creator","order_index":5,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${OwnedTableId},"name":"owner","order_index":6,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`

export const AllowanceFields = `[
{"table_id":${AllowanceTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${AllowanceTableId},"name":"table_id","order_index":2,"value_type":"INTEGER","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"${DTypeTableName}","foreign_key_field":"id","foreign_key_sql_options":"ON UPDATE CASCADE ON DELETE RESTRICT","description":"","permissions":""},
{"table_id":${AllowanceTableId},"name":"record_id","order_index":3,"value_type":"INTEGER","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${AllowanceTableId},"name":"owner","order_index":4,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${AllowanceTableId},"name":"spender","order_index":5,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${AllowanceTableId},"name":"owned","order_index":6,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${AllowanceTableId},"name":"amount","order_index":7,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`

// identity

export const IdentityTables = `[
{"name":"${IdentityTable}","db_id":"1","description":"table for identities"},{"name":"${FullNameTable}","db_id":"1","description":"table for identity full names"},
{"name":"${EmailTable}","db_id":"1","description":"table for identity emails"}
]`

export const IdentityTableFields = `[
{"table_id":${IdentityTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${IdentityTableId},"name":"name","order_index":2,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${IdentityTableId},"name":"address","order_index":3,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`

// relations: primary, formal, historic, maiden name, nickname
export const FullNameTableFields = `[
{"table_id":${FullNameTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Unique row ID","permissions":""},
{"table_id":${FullNameTableId},"name":"title","order_index":2,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Common titles like Mr, Ms, Mrs, Mx","permissions":""},
{"table_id":${FullNameTableId},"name":"honorific_prefix","order_index":3,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Prefixes like Dr., Prof., Sir, Fr., Rev.","permissions":""},
{"table_id":${FullNameTableId},"name":"given_name","order_index":4,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"First name or personal name","permissions":""},
{"table_id":${FullNameTableId},"name":"middle_name","order_index":5,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Optional middle or additional name(s)","permissions":""},
{"table_id":${FullNameTableId},"name":"family_name","order_index":6,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Last name or inherited family name","permissions":""},
{"table_id":${FullNameTableId},"name":"suffix","order_index":7,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Name suffix like Jr., Sr., III, Esq.","permissions":""},
{"table_id":${FullNameTableId},"name":"postnominal","order_index":8,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Degrees/titles after name (PhD, MD, OBE)","permissions":""},
{"table_id":${FullNameTableId},"name":"full_display_name","order_index":9,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Computed or formatted full name for display","permissions":""},
{"table_id":${FullNameTableId},"name":"locale","order_index":10,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT 'en-US'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"e.g. en-US, ar-SA — used for culturally-aware display rules","permissions":""},
{"table_id":${FullNameTableId},"name":"notes","order_index":11,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Optional extra context or comments","permissions":""}
]`

// TODO other system: verified, active
export const EmailTableFields = `[
{"table_id":${EmailTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Unique ID","permissions":""},
{"table_id":${EmailTableId},"name":"full_address","order_index":2,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Full email address","permissions":""},
{"table_id":${EmailTableId},"name":"username","order_index":3,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"email username","permissions":""},
{"table_id":${EmailTableId},"name":"domain","order_index":4,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"email domain","permissions":""},
{"table_id":${EmailTableId},"name":"provider","order_index":5,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Logical provider name","permissions":""},
{"table_id":${EmailTableId},"name":"host","order_index":6,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"SMTP/IMAP hostname if known","permissions":""},
{"table_id":${EmailTableId},"name":"category","order_index":7,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"e.g., work, personal, school, alias","permissions":""},
{"table_id":${EmailTableId},"name":"notes","order_index":8,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"Optional comments or manual annotations","permissions":""}
]`
