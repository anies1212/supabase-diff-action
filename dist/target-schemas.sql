SELECT nspname
FROM pg_namespace
WHERE nspname NOT LIKE 'pg_%'
  AND nspname NOT IN ($1)
  AND nspname != 'information_schema'
ORDER BY nspname
