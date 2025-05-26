// email table
// id, owner_id, uid, messageId, date, body, raw, bh, subject, from, sender,
// node_id (for email)
// ReplyTo, To , Cc, Bcc, InReplyTo - as insert relations
// References

// relation email - identity_email (sender <-> receiver) - replyTo, To, Cc, Bcc
// relation email - email (list_next, list_previous) - InReplyTo, References (or reply relation)
// relation email - thread (partOf , parentOf)

// source_node_table, source_node_id
// target_node_table, target_node_id
//


export const TableProviderName = `email_provider`
export const TableThreadName = `email_thread`
export const TableEmailName = `email_message`
// TODO attachments
export const TableEmailAttachmentName = `email_attachment`

export const EmailTables = `[
{"name":"${TableProviderName}","db_id":"1","description":"table for email providers"},
{"name":"${TableThreadName}","db_id":"1","description":"table for email threads"},
{"name":"${TableEmailName}","db_id":"1","description":"table for emails"}
]`

export function getProviderFields(providerTableId: i64): string {
    return `[
{"table_id":${providerTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${providerTableId},"name":"name","order_index":2,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${providerTableId},"name":"domain","order_index":3,"value_type":"VARCHAR","indexed":true,"sql_options":"UNIQUE NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${providerTableId},"name":"imap_server_url","order_index":4,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${providerTableId},"name":"smtp_server_url_starttls","order_index":5,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${providerTableId},"name":"smtp_server_url_tls","order_index":6,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`
}

export function getThreadFields(threadTableId: i64): string {
    return `[
{"table_id":${threadTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${threadTableId},"name":"last_email_message_id","order_index":2,"value_type":"INTEGER","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${threadTableId},"name":"owner","order_index":3,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${threadTableId},"name":"email_message_ids","order_index":4,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT '[]'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${threadTableId},"name":"missing_refs","order_index":5,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT '[]'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${threadTableId},"name":"name","order_index":6,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`
}

export function getEmailFields(emailTableId: i64): string {
    return `[
{"table_id":${emailTableId},"name":"id","order_index":1,"value_type":"INTEGER","indexed":false,"sql_options":"PRIMARY KEY","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"uid","order_index":2,"value_type":"INTEGER","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"raw","order_index":3,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"bh","order_index":4,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"body","order_index":5,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"timestamp","order_index":6,"value_type":"INTEGER","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"envelope","order_index":7,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"envelope_Subject","order_index":8,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT ''","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"envelope_MessageID","order_index":9,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"header","order_index":10,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"header_References","order_index":11,"value_type":"TEXT","indexed":false,"sql_options":"NOT NULL DEFAULT '[]'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"flags","order_index":12,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL DEFAULT '[]'","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"name","order_index":13,"value_type":"VARCHAR","indexed":false,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"owner","order_index":14,"value_type":"VARCHAR","indexed":true,"sql_options":"NOT NULL","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""},
{"table_id":${emailTableId},"name":"rfc822_size","order_index":15,"value_type":"INTEGER","indexed":false,"sql_options":"NOT NULL DEFAULT 0","foreign_key_table":"","foreign_key_field":"","foreign_key_sql_options":"","description":"","permissions":""}
]`
}
