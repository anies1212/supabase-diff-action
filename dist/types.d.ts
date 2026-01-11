export interface EdgeFunction {
    id: string;
    name: string;
    slug: string;
    status: string;
    version: number;
    createdAt: string;
    updatedAt: string;
}
export interface RlsPolicy {
    schemaName: string;
    tableName: string;
    policyName: string;
    permissive: string;
    roles: string[];
    cmd: string;
    qual: string | null;
    withCheck: string | null;
}
export interface SqlFunction {
    schemaName: string;
    functionName: string;
    arguments: string;
    returnType: string;
    definition: string;
    language: string;
    securityDefiner: boolean;
    volatility: string;
}
export interface TableColumn {
    columnName: string;
    dataType: string;
    isNullable: boolean;
    columnDefault: string | null;
    characterMaxLength: number | null;
}
export interface TableIndex {
    indexName: string;
    indexDef: string;
}
export interface TableConstraint {
    constraintName: string;
    constraintType: string;
    constraintDef: string;
}
export interface TableSchema {
    schemaName: string;
    tableName: string;
    columns: TableColumn[];
    indexes: TableIndex[];
    constraints: TableConstraint[];
}
export interface DiffResult<T> {
    onlyInDev: T[];
    onlyInPrd: T[];
    different: Array<{
        dev: T;
        prd: T;
        differences: string[];
    }>;
    matching: T[];
}
export interface ActionInputs {
    supabaseAccessToken: string;
    devProjectRef: string;
    devDbUrl: string;
    prdProjectRef: string;
    prdDbUrl: string;
    githubToken: string;
    checkEdgeFunctions: boolean;
    checkRlsPolicies: boolean;
    checkSqlFunctions: boolean;
    checkSchemas: boolean;
    failOnDiff: boolean;
    excludedSchemas: string[];
}
export interface DiffSummary {
    hasDiff: boolean;
    edgeFunctions?: DiffResult<EdgeFunction>;
    rlsPolicies?: DiffResult<RlsPolicy>;
    sqlFunctions?: DiffResult<SqlFunction>;
    schemas?: DiffResult<TableSchema>;
}
