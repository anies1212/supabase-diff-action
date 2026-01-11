import { Client } from 'pg';
import { SqlFunction } from '../types';
import { loadSql, SQL } from '../sql/loader';

export async function getSqlFunctions(
  dbUrl: string,
  excludedSchemas: string[]
): Promise<SqlFunction[]> {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();

    const targetSchemasQuery = loadSql(SQL.TARGET_SCHEMAS);
    const excludedSchemasStr = excludedSchemas.join(',');
    const schemasResult = await client.query(targetSchemasQuery, [
      excludedSchemasStr,
    ]);
    const targetSchemas = schemasResult.rows.map((row) => row.nspname);

    if (targetSchemas.length === 0) {
      return [];
    }

    const sqlFunctionsQuery = loadSql(SQL.SQL_FUNCTIONS);
    const result = await client.query(sqlFunctionsQuery, [targetSchemas]);

    return result.rows.map((row) => ({
      schemaName: row.schema_name,
      functionName: row.function_name,
      arguments: row.arguments,
      returnType: row.return_type,
      definition: row.definition,
      language: row.language,
      securityDefiner: row.security_definer,
      volatility: mapVolatility(row.volatility),
    }));
  } finally {
    await client.end();
  }
}

function mapVolatility(code: string): string {
  switch (code) {
    case 'i':
      return 'IMMUTABLE';
    case 's':
      return 'STABLE';
    case 'v':
      return 'VOLATILE';
    default:
      return code;
  }
}
