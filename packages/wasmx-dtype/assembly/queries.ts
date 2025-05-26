export const QueryRecordsByRelationTypeAndSource = function(field: string): string {
    return `SELECT
  t_target.id AS target_table_id,
  t_target.name AS target_table_name,
  n_target.record_id AS target_record_id,
  n_target.name AS target_node_name
FROM
  relation r
JOIN relation_type rt ON r.relation_type_id = rt.id
JOIN node n_source ON r.source_node_id = n_source.id
JOIN node n_target ON r.target_node_id = n_target.id
JOIN dtype_table t_target ON n_target.table_id = t_target.id
WHERE
  rt.${field} = ?
  AND n_source.table_id = ?
  AND n_source.record_id = ?
`
}

export const QueryRecordsByRelationTypeAndTarget = function(field: string): string {
    return `SELECT
  t_source.id AS source_table_id,
  t_source.name AS source_table_name,
  n_source.record_id AS source_record_id,
  n_source.name AS source_node_name
FROM
  relation r
JOIN relation_type rt ON r.relation_type_id = rt.id
JOIN node n_source ON r.source_node_id = n_source.id
JOIN node n_target ON r.target_node_id = n_target.id
JOIN dtype_table t_source ON n_source.table_id = t_source.id
WHERE
  rt.${field} = ?
  AND n_target.table_id = ?
  AND n_target.record_id = ?
`
}
