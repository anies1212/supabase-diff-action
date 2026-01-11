SELECT
  table_schema AS schema_name,
  table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ($1)
ORDER BY table_schema, table_name
