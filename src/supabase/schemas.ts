import { TableSchema, TableColumn, TableIndex, TableConstraint } from '../types';
import { loadSql, SQL } from '../sql/loader';
import { createClientWithIPv4 } from './db';

export async function getSchemas(
  dbUrl: string,
  excludedSchemas: string[]
): Promise<TableSchema[]> {
  const client = await createClientWithIPv4(dbUrl);

  try {
    await client.connect();

    const tablesQuery = loadSql(SQL.TABLES);
    const columnsQuery = loadSql(SQL.COLUMNS);
    const indexesQuery = loadSql(SQL.INDEXES);
    const constraintsQuery = loadSql(SQL.CONSTRAINTS);

    const excludedSchemasStr = excludedSchemas.join(',');

    // Fetch all data in parallel with 4 queries
    const [tablesResult, columnsResult, indexesResult, constraintsResult] =
      await Promise.all([
        client.query(tablesQuery, [excludedSchemasStr]),
        client.query(columnsQuery, [excludedSchemasStr]),
        client.query(indexesQuery, [excludedSchemasStr]),
        client.query(constraintsQuery, [excludedSchemasStr]),
      ]);

    // Group columns by schema.table
    const columnsMap = new Map<string, TableColumn[]>();
    for (const row of columnsResult.rows) {
      const key = `${row.schema_name}.${row.table_name}`;
      if (!columnsMap.has(key)) {
        columnsMap.set(key, []);
      }
      columnsMap.get(key)!.push({
        columnName: row.column_name,
        dataType: row.data_type,
        isNullable: row.is_nullable === 'YES',
        columnDefault: row.column_default,
        characterMaxLength: row.character_maximum_length,
      });
    }

    // Group indexes by schema.table
    const indexesMap = new Map<string, TableIndex[]>();
    for (const row of indexesResult.rows) {
      const key = `${row.schema_name}.${row.table_name}`;
      if (!indexesMap.has(key)) {
        indexesMap.set(key, []);
      }
      indexesMap.get(key)!.push({
        indexName: row.index_name,
        indexDef: row.index_def,
      });
    }

    // Group constraints by schema.table
    const constraintsMap = new Map<string, TableConstraint[]>();
    for (const row of constraintsResult.rows) {
      const key = `${row.schema_name}.${row.table_name}`;
      if (!constraintsMap.has(key)) {
        constraintsMap.set(key, []);
      }
      constraintsMap.get(key)!.push({
        constraintName: row.constraint_name,
        constraintType: row.constraint_type,
        constraintDef: row.constraint_def,
      });
    }

    // Build table schemas
    return tablesResult.rows.map((tableRow) => {
      const key = `${tableRow.schema_name}.${tableRow.table_name}`;
      return {
        schemaName: tableRow.schema_name,
        tableName: tableRow.table_name,
        columns: columnsMap.get(key) || [],
        indexes: indexesMap.get(key) || [],
        constraints: constraintsMap.get(key) || [],
      };
    });
  } finally {
    await client.end();
  }
}
