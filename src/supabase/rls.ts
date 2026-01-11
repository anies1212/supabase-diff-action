import { Client } from 'pg';
import { RlsPolicy } from '../types';
import { loadSql, SQL } from '../sql/loader';

export async function getRlsPolicies(
  dbUrl: string,
  excludedSchemas: string[]
): Promise<RlsPolicy[]> {
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();

    const query = loadSql(SQL.RLS_POLICIES);
    const excludedSchemasStr = excludedSchemas.join(',');
    const result = await client.query(query, [excludedSchemasStr]);

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
