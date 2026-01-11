SELECT
  indexname AS index_name,
  indexdef AS index_def
FROM pg_indexes
WHERE schemaname = $1 AND tablename = $2
ORDER BY indexname
