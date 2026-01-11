import { Client } from 'pg';
import { SqlFunction } from '../types';

const SQL_FUNCTIONS_QUERY = `
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  pg_get_functiondef(p.oid) AS definition,
  l.lanname AS language,
  p.prosecdef AS security_definer,
  p.provolatile AS volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = ANY($1::text[])
  AND p.prokind = 'f'
ORDER BY n.nspname, p.proname
`;

const TARGET_SCHEMAS_QUERY = `
SELECT nspname
FROM pg_namespace
WHERE nspname NOT LIKE 'pg_%'
  AND nspname NOT IN ($1)
  AND nspname != 'information_schema'
ORDER BY nspname
`;

export async function getSqlFunctions(
  dbUrl: string,
  excludedSchemas: string[]
): Promise<SqlFunction[]> {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();

    const excludedSchemasStr = excludedSchemas.join(',');
    const schemasResult = await client.query(TARGET_SCHEMAS_QUERY, [
      excludedSchemasStr,
    ]);
    const targetSchemas = schemasResult.rows.map((row) => row.nspname);

    if (targetSchemas.length === 0) {
      return [];
    }

    const result = await client.query(SQL_FUNCTIONS_QUERY, [targetSchemas]);

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
