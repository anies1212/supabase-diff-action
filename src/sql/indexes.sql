SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS index_def
FROM pg_indexes
WHERE schemaname NOT IN (SELECT unnest(string_to_array($1, ',')))
ORDER BY schemaname, tablename, indexname
