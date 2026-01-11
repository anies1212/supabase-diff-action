import * as fs from 'fs';
import * as path from 'path';

const sqlCache = new Map<string, string>();

export function loadSql(filename: string): string {
  if (sqlCache.has(filename)) {
    return sqlCache.get(filename)!;
  }

  const sqlPath = path.join(__dirname, filename);
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  sqlCache.set(filename, sql);

  return sql;
}

export const SQL = {
  RLS_POLICIES: 'rls-policies.sql',
  TARGET_SCHEMAS: 'target-schemas.sql',
  SQL_FUNCTIONS: 'sql-functions.sql',
  TABLES: 'tables.sql',
  COLUMNS: 'columns.sql',
  INDEXES: 'indexes.sql',
  CONSTRAINTS: 'constraints.sql',
} as const;
