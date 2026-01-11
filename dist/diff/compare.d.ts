import { DiffResult, EdgeFunction, RlsPolicy, SqlFunction, TableSchema } from '../types';
export declare function compareEdgeFunctions(devFunctions: EdgeFunction[], prdFunctions: EdgeFunction[]): DiffResult<EdgeFunction>;
export declare function compareRlsPolicies(devPolicies: RlsPolicy[], prdPolicies: RlsPolicy[]): DiffResult<RlsPolicy>;
export declare function compareSqlFunctions(devFunctions: SqlFunction[], prdFunctions: SqlFunction[]): DiffResult<SqlFunction>;
export declare function compareSchemas(devSchemas: TableSchema[], prdSchemas: TableSchema[]): DiffResult<TableSchema>;
//# sourceMappingURL=compare.d.ts.map