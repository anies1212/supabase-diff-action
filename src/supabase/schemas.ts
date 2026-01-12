import { TableSchema, TableColumn, TableIndex, TableConstraint } from '../types';
import { loadSql, SQL } from '../sql/loader';
import { createClient } from './db';

export async function getSchemas(
  dbUrl: string,
  excludedSchemas: string[]
): Promise<TableSchema[]> {
  const client = createClient(dbUrl);

  try {
    await client.connect();

    const tablesQuery = loadSql(SQL.TABLES);
    const columnsQuery = loadSql(SQL.COLUMNS);
    const indexesQuery = loadSql(SQL.INDEXES);
    const constraintsQuery = loadSql(SQL.CONSTRAINTS);

    const excludedSchemasStr = excludedSchemas.join(',');
    const tablesResult = await client.query(tablesQuery, [excludedSchemasStr]);

    const schemaPromises = tablesResult.rows.map(async (tableRow) => {
      const schemaName = tableRow.schema_name;
      const tableName = tableRow.table_name;

      const [columnsResult, indexesResult, constraintsResult] =
        await Promise.all([
          client.query(columnsQuery, [schemaName, tableName]),
          client.query(indexesQuery, [schemaName, tableName]),
          client.query(constraintsQuery, [schemaName, tableName]),
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

      return {
        schemaName,
        tableName,
        columns,
        indexes,
        constraints,
      };
    });

    return Promise.all(schemaPromises);
  } finally {
    await client.end();
  }
}
