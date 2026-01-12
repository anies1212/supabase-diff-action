import { RlsPolicy } from '../types';
import { loadSql, SQL } from '../sql/loader';
import { createClientWithIPv4 } from './db';

// Parse PostgreSQL array to JavaScript array
function parseRoles(roles: unknown): string[] {
  if (Array.isArray(roles)) {
    return roles;
  }
  if (typeof roles === 'string') {
    // Handle PostgreSQL array format: {role1,role2}
    const trimmed = roles.replace(/^\{|\}$/g, '');
    if (trimmed === '') {
      return [];
    }
    return trimmed.split(',');
  }
  return [];
}

export async function getRlsPolicies(
  dbUrl: string,
  excludedSchemas: string[]
): Promise<RlsPolicy[]> {
  const client = await createClientWithIPv4(dbUrl);

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
      roles: parseRoles(row.roles),
      cmd: row.cmd,
      qual: row.qual,
      withCheck: row.with_check,
    }));
  } finally {
    await client.end();
  }
}
