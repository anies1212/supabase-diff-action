import { Client } from 'pg';
import { TableSchema, TableColumn, TableIndex, TableConstraint } from '../types';

const TABLES_QUERY = `
SELECT
  table_schema AS schema_name,
  table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ($1)
ORDER BY table_schema, table_name
`;

const COLUMNS_QUERY = `
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = $1 AND table_name = $2
ORDER BY ordinal_position
`;

const INDEXES_QUERY = `
SELECT
  indexname AS index_name,
  indexdef AS index_def
FROM pg_indexes
WHERE schemaname = $1 AND tablename = $2
ORDER BY indexname
`;

const CONSTRAINTS_QUERY = `
SELECT
  c.conname AS constraint_name,
  CASE c.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    WHEN 'x' THEN 'EXCLUDE'
    ELSE c.contype::text
  END AS constraint_type,
  pg_get_constraintdef(c.oid) AS constraint_def
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class t ON t.oid = c.conrelid
WHERE n.nspname = $1 AND t.relname = $2
ORDER BY c.conname
`;

export async function getSchemas(
  dbUrl: string,
  excludedSchemas: string[]
): Promise<TableSchema[]> {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();

    const excludedSchemasStr = excludedSchemas.join(',');
    const tablesResult = await client.query(TABLES_QUERY, [excludedSchemasStr]);
    const schemas: TableSchema[] = [];

    for (const tableRow of tablesResult.rows) {
      const schemaName = tableRow.schema_name;
      const tableName = tableRow.table_name;

      const [columnsResult, indexesResult, constraintsResult] =
        await Promise.all([
          client.query(COLUMNS_QUERY, [schemaName, tableName]),
          client.query(INDEXES_QUERY, [schemaName, tableName]),
          client.query(CONSTRAINTS_QUERY, [schemaName, tableName]),
        ]);

      const columns: TableColumn[] = columnsResult.rows.map((row) => ({
        columnName: row.column_name,
        dataType: row.data_type,
        isNullable: row.is_nullable === 'YES',
        columnDefault: row.column_default,
        characterMaxLength: row.character_maximum_length,
      }));

      const indexes: TableIndex[] = indexesResult.rows.map((row) => ({
        indexName: row.index_name,
        indexDef: row.index_def,
      }));

      const constraints: TableConstraint[] = constraintsResult.rows.map(
        (row) => ({
          constraintName: row.constraint_name,
          constraintType: row.constraint_type,
          constraintDef: row.constraint_def,
        })
      );

      schemas.push({
        schemaName,
        tableName,
        columns,
        indexes,
        constraints,
      });
    }

    return schemas;
  } finally {
    await client.end();
  }
}
