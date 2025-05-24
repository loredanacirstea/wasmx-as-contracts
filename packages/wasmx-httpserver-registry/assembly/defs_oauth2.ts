export const TableNameOauth2Providers = "oauth2_provider"
export const TableNameOauth2Endpoint = "oauth2_endpoint"
export const TableNameOAuth2Session = "oauth2_session"
export const TableNameOAuth2UserInfo = "oauth2_user_info"
export const Tables = `[
{"name":"${TableNameOauth2Providers}","db_id":"1","description":"table for oauth2 providers"},
{"name":"${TableNameOauth2Endpoint}","db_id":"1","description":"table for oauth2 provider endpoints"},
{"name":"${TableNameOAuth2UserInfo}","db_id":"1","description":"table for oauth2 user infos"},
{"name":"${TableNameOAuth2Session}","db_id":"1","description":"table for oauth2 sessions"}
]`

// OAuth2Config
export function getTableFieldsOauth2Provider(tableId: i64): string {
    return `[
{"table_id":${tableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"client_id","order_index":2,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"client_secret","order_index":3,"value_type":"VARCHAR","indexed":false,"sql_options":"UNIQUE NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"redirect_url","order_index":4,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"scopes","order_index":5,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT '[]'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"provider","order_index":6,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`
}

// Endpoint
export function getTableFieldsOAuth2Endpoint(tableId: i64): string {
    return `[
{"table_id":${tableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"name","order_index":2,"value_type":"VARCHAR","indexed":true,"sql_options":"UNIQUE NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"auth_url","order_index":3,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"device_auth_url","order_index":4,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"token_url","order_index":5,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"auth_style","order_index":6,"value_type":"INTEGER","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"user_info_url","order_index":7,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`
}

export function getTableFieldsOAuth2Session(tableId: i64): string {
    return `[
{"table_id":${tableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"username","order_index":2,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"password","order_index":3,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"expires","order_index":4,"value_type":"INTEGER","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"token","order_index":5,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"provider","order_index":6,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"jwttoken","order_index":7,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"claims","order_index":8,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`}

export function getTableFieldsOAuth2UserInfo(tableId: i64): string {
    return `[
{"table_id":${tableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"email","order_index":2,"value_type":"VARCHAR","indexed":true,"sql_options":"UNIQUE NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"name","order_index":3,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"sub","order_index":4,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"given_name","order_index":5,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"family_name","order_index":6,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"picture","order_index":7,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"email_verified","order_index":8,"value_type":"BOOLEAN","indexed":false,"sql_options":"NOT NULL DEFAULT false","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${tableId},"name":"provider","order_index":10,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`
}
