SELECT
  table_schema AS schema_name,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema NOT IN (SELECT unnest(string_to_array($1, ',')))
ORDER BY table_schema, table_name, ordinal_position
