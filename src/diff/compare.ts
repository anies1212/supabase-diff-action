import {
  DiffResult,
  EdgeFunction,
  RlsPolicy,
  SqlFunction,
  TableSchema,
} from '../types';

export function compareEdgeFunctions(
  devFunctions: EdgeFunction[],
  prdFunctions: EdgeFunction[]
): DiffResult<EdgeFunction> {
  const devMap = new Map(devFunctions.map((f) => [f.slug, f]));
  const prdMap = new Map(prdFunctions.map((f) => [f.slug, f]));

  const onlyInDev: EdgeFunction[] = [];
  const onlyInPrd: EdgeFunction[] = [];
  const different: Array<{
    dev: EdgeFunction;
    prd: EdgeFunction;
    differences: string[];
  }> = [];
  const matching: EdgeFunction[] = [];

  for (const [slug, devFn] of devMap) {
    const prdFn = prdMap.get(slug);
    if (!prdFn) {
      onlyInDev.push(devFn);
    } else {
      const diffs = compareEdgeFunction(devFn, prdFn);
      if (diffs.length > 0) {
        different.push({ dev: devFn, prd: prdFn, differences: diffs });
      } else {
        matching.push(devFn);
      }
    }
  }

  for (const [slug, prdFn] of prdMap) {
    if (!devMap.has(slug)) {
      onlyInPrd.push(prdFn);
    }
  }

  return { onlyInDev, onlyInPrd, different, matching };
}

function compareEdgeFunction(
  dev: EdgeFunction,
  prd: EdgeFunction
): string[] {
  const diffs: string[] = [];

  if (dev.version !== prd.version) {
    diffs.push(`version: ${dev.version} → ${prd.version}`);
  }
  if (dev.status !== prd.status) {
    diffs.push(`status: ${dev.status} → ${prd.status}`);
  }

  return diffs;
}

export function compareRlsPolicies(
  devPolicies: RlsPolicy[],
  prdPolicies: RlsPolicy[]
): DiffResult<RlsPolicy> {
  const getKey = (p: RlsPolicy) =>
    `${p.schemaName}.${p.tableName}.${p.policyName}`;

  const devMap = new Map(devPolicies.map((p) => [getKey(p), p]));
  const prdMap = new Map(prdPolicies.map((p) => [getKey(p), p]));

  const onlyInDev: RlsPolicy[] = [];
  const onlyInPrd: RlsPolicy[] = [];
  const different: Array<{
    dev: RlsPolicy;
    prd: RlsPolicy;
    differences: string[];
  }> = [];
  const matching: RlsPolicy[] = [];

  for (const [key, devPolicy] of devMap) {
    const prdPolicy = prdMap.get(key);
    if (!prdPolicy) {
      onlyInDev.push(devPolicy);
    } else {
      const diffs = compareRlsPolicy(devPolicy, prdPolicy);
      if (diffs.length > 0) {
        different.push({ dev: devPolicy, prd: prdPolicy, differences: diffs });
      } else {
        matching.push(devPolicy);
      }
    }
  }

  for (const [key, prdPolicy] of prdMap) {
    if (!devMap.has(key)) {
      onlyInPrd.push(prdPolicy);
    }
  }

  return { onlyInDev, onlyInPrd, different, matching };
}

function compareRlsPolicy(dev: RlsPolicy, prd: RlsPolicy): string[] {
  const diffs: string[] = [];

  if (dev.permissive !== prd.permissive) {
    diffs.push(`permissive: ${dev.permissive} → ${prd.permissive}`);
  }
  if (JSON.stringify(dev.roles) !== JSON.stringify(prd.roles)) {
    diffs.push(`roles: [${dev.roles.join(',')}] → [${prd.roles.join(',')}]`);
  }
  if (dev.cmd !== prd.cmd) {
    diffs.push(`cmd: ${dev.cmd} → ${prd.cmd}`);
  }
  if (dev.qual !== prd.qual) {
    diffs.push(`qual: definition differs`);
  }
  if (dev.withCheck !== prd.withCheck) {
    diffs.push(`with_check: definition differs`);
  }

  return diffs;
}

export function compareSqlFunctions(
  devFunctions: SqlFunction[],
  prdFunctions: SqlFunction[]
): DiffResult<SqlFunction> {
  const getKey = (f: SqlFunction) =>
    `${f.schemaName}.${f.functionName}(${f.arguments})`;

  const devMap = new Map(devFunctions.map((f) => [getKey(f), f]));
  const prdMap = new Map(prdFunctions.map((f) => [getKey(f), f]));

  const onlyInDev: SqlFunction[] = [];
  const onlyInPrd: SqlFunction[] = [];
  const different: Array<{
    dev: SqlFunction;
    prd: SqlFunction;
    differences: string[];
  }> = [];
  const matching: SqlFunction[] = [];

  for (const [key, devFn] of devMap) {
    const prdFn = prdMap.get(key);
    if (!prdFn) {
      onlyInDev.push(devFn);
    } else {
      const diffs = compareSqlFunction(devFn, prdFn);
      if (diffs.length > 0) {
        different.push({ dev: devFn, prd: prdFn, differences: diffs });
      } else {
        matching.push(devFn);
      }
    }
  }

  for (const [key, prdFn] of prdMap) {
    if (!devMap.has(key)) {
      onlyInPrd.push(prdFn);
    }
  }

  return { onlyInDev, onlyInPrd, different, matching };
}

function compareSqlFunction(dev: SqlFunction, prd: SqlFunction): string[] {
  const diffs: string[] = [];

  if (dev.returnType !== prd.returnType) {
    diffs.push(`return_type: ${dev.returnType} → ${prd.returnType}`);
  }
  if (dev.language !== prd.language) {
    diffs.push(`language: ${dev.language} → ${prd.language}`);
  }
  if (dev.securityDefiner !== prd.securityDefiner) {
    diffs.push(
      `security_definer: ${dev.securityDefiner} → ${prd.securityDefiner}`
    );
  }
  if (dev.volatility !== prd.volatility) {
    diffs.push(`volatility: ${dev.volatility} → ${prd.volatility}`);
  }
  if (normalizeDefinition(dev.definition) !== normalizeDefinition(prd.definition)) {
    diffs.push(`definition: differs`);
  }

  return diffs;
}

function normalizeDefinition(def: string): string {
  return def.replace(/\s+/g, ' ').trim();
}

export function compareSchemas(
  devSchemas: TableSchema[],
  prdSchemas: TableSchema[]
): DiffResult<TableSchema> {
  const getKey = (s: TableSchema) => `${s.schemaName}.${s.tableName}`;

  const devMap = new Map(devSchemas.map((s) => [getKey(s), s]));
  const prdMap = new Map(prdSchemas.map((s) => [getKey(s), s]));

  const onlyInDev: TableSchema[] = [];
  const onlyInPrd: TableSchema[] = [];
  const different: Array<{
    dev: TableSchema;
    prd: TableSchema;
    differences: string[];
  }> = [];
  const matching: TableSchema[] = [];

  for (const [key, devSchema] of devMap) {
    const prdSchema = prdMap.get(key);
    if (!prdSchema) {
      onlyInDev.push(devSchema);
    } else {
      const diffs = compareTableSchema(devSchema, prdSchema);
      if (diffs.length > 0) {
        different.push({
          dev: devSchema,
          prd: prdSchema,
          differences: diffs,
        });
      } else {
        matching.push(devSchema);
      }
    }
  }

  for (const [key, prdSchema] of prdMap) {
    if (!devMap.has(key)) {
      onlyInPrd.push(prdSchema);
    }
  }

  return { onlyInDev, onlyInPrd, different, matching };
}

function compareTableSchema(
  dev: TableSchema,
  prd: TableSchema
): string[] {
  const diffs: string[] = [];

  const devCols = new Map(dev.columns.map((c) => [c.columnName, c]));
  const prdCols = new Map(prd.columns.map((c) => [c.columnName, c]));

  for (const [name, devCol] of devCols) {
    const prdCol = prdCols.get(name);
    if (!prdCol) {
      diffs.push(`column "${name}": only in dev`);
    } else {
      if (devCol.dataType !== prdCol.dataType) {
        diffs.push(
          `column "${name}" data_type: ${devCol.dataType} → ${prdCol.dataType}`
        );
      }
      if (devCol.isNullable !== prdCol.isNullable) {
        diffs.push(
          `column "${name}" nullable: ${devCol.isNullable} → ${prdCol.isNullable}`
        );
      }
      if (devCol.columnDefault !== prdCol.columnDefault) {
        diffs.push(`column "${name}" default: differs`);
      }
    }
  }

  for (const name of prdCols.keys()) {
    if (!devCols.has(name)) {
      diffs.push(`column "${name}": only in prod`);
    }
  }

  const devIndexes = new Map(dev.indexes.map((i) => [i.indexName, i]));
  const prdIndexes = new Map(prd.indexes.map((i) => [i.indexName, i]));

  for (const [name, devIdx] of devIndexes) {
    const prdIdx = prdIndexes.get(name);
    if (!prdIdx) {
      diffs.push(`index "${name}": only in dev`);
    } else if (devIdx.indexDef !== prdIdx.indexDef) {
      diffs.push(`index "${name}": definition differs`);
    }
  }

  for (const name of prdIndexes.keys()) {
    if (!devIndexes.has(name)) {
      diffs.push(`index "${name}": only in prod`);
    }
  }

  const devConstraints = new Map(
    dev.constraints.map((c) => [c.constraintName, c])
  );
  const prdConstraints = new Map(
    prd.constraints.map((c) => [c.constraintName, c])
  );

  for (const [name, devConst] of devConstraints) {
    const prdConst = prdConstraints.get(name);
    if (!prdConst) {
      diffs.push(`constraint "${name}": only in dev`);
    } else if (devConst.constraintDef !== prdConst.constraintDef) {
      diffs.push(`constraint "${name}": definition differs`);
    }
  }

  for (const name of prdConstraints.keys()) {
    if (!devConstraints.has(name)) {
      diffs.push(`constraint "${name}": only in prod`);
    }
  }

  return diffs;
}
