export const TableNameRegistry = "httpserver_registry"
export const Tables = `[
{"name":"${TableNameRegistry}","db_id":"1","description":"table for http server route registry"},
]`

// id, route, contract_address
export function getTableFieldsRegistry(tableId: i64): string {
    return `[
{"table_id":${tableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"route","order_index":2,"value_type":"VARCHAR","indexed":true,"sql_options":"UNIQUE NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"contract_address","order_index":3,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"authorization","order_index":4,"value_type":"BOOLEAN","indexed":false,"sql_options":"NOT NULL DEFAULT false","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"authorization_type","order_index":5,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`
}
