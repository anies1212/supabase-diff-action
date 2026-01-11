import { Client } from 'pg';
import { RlsPolicy } from '../types';

const RLS_QUERY = `
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname NOT IN ($1)
ORDER BY schemaname, tablename, policyname
`;

export async function getRlsPolicies(
  dbUrl: string,
  excludedSchemas: string[]
): Promise<RlsPolicy[]> {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();

    const excludedSchemasStr = excludedSchemas.join(',');
    const result = await client.query(RLS_QUERY, [excludedSchemasStr]);

    return result.rows.map((row) => ({
      schemaName: row.schema_name,
      tableName: row.table_name,
      policyName: row.policy_name,
      permissive: row.permissive,
      roles: row.roles,
      cmd: row.cmd,
      qual: row.qual,
      withCheck: row.with_check,
    }));
  } finally {
    await client.end();
  }
}
