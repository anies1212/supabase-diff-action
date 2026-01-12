import * as core from '@actions/core';
import { getEdgeFunctions } from './supabase/functions';
import { getRlsPolicies } from './supabase/rls';
import { getSqlFunctions } from './supabase/sql-functions';
import { getSchemas } from './supabase/schemas';
import {
  compareEdgeFunctions,
  compareRlsPolicies,
  compareSqlFunctions,
  compareSchemas,
} from './diff/compare';
import { postPrComment } from './github/comment';
import {
  ActionInputs,
  DiffSummary,
  DiffResult,
  PairwiseDiffResult,
  EnvironmentPair,
  EdgeFunction,
  RlsPolicy,
  SqlFunction,
  TableSchema,
} from './types';

function getInputs(): ActionInputs {
  const stgProjectRef = core.getInput('stg_project_ref') || undefined;
  const stgDbUrl = core.getInput('stg_db_url') || undefined;

  return {
    supabaseAccessToken: core.getInput('supabase_access_token', {
      required: true,
    }),
    devProjectRef: core.getInput('dev_project_ref', { required: true }),
    devDbUrl: core.getInput('dev_db_url', { required: true }),
    stgProjectRef,
    stgDbUrl,
    prdProjectRef: core.getInput('prd_project_ref', { required: true }),
    prdDbUrl: core.getInput('prd_db_url', { required: true }),
    githubToken: core.getInput('github_token', { required: true }),
    checkEdgeFunctions: core.getInput('check_edge_functions') !== 'false',
    checkRlsPolicies: core.getInput('check_rls_policies') !== 'false',
    checkSqlFunctions: core.getInput('check_sql_functions') !== 'false',
    checkSchemas: core.getInput('check_schemas') !== 'false',
    failOnDiff: core.getInput('fail_on_diff') === 'true',
    excludedSchemas: core
      .getInput('excluded_schemas')
      .split(',')
      .map((s) => s.trim()),
  };
}

function hasStgEnvironment(inputs: ActionInputs): boolean {
  return !!(inputs.stgProjectRef && inputs.stgDbUrl);
}

interface CheckResult<T> {
  name: string;
  diffs: PairwiseDiffResult<T>[] | null;
  error: Error | null;
  counts: { env: string; count: number }[];
}

async function checkEdgeFunctionsTask(
  inputs: ActionInputs
): Promise<CheckResult<EdgeFunction>> {
  try {
    core.info('Fetching Edge Functions...');
    const hasStg = hasStgEnvironment(inputs);

    const fetchPromises: Promise<EdgeFunction[]>[] = [
      getEdgeFunctions(inputs.devProjectRef, inputs.supabaseAccessToken),
      getEdgeFunctions(inputs.prdProjectRef, inputs.supabaseAccessToken),
    ];
    if (hasStg) {
      fetchPromises.splice(
        1,
        0,
        getEdgeFunctions(inputs.stgProjectRef!, inputs.supabaseAccessToken)
      );
    }

    const results = await Promise.all(fetchPromises);
    const devFunctions = results[0];
    const stgFunctions = hasStg ? results[1] : null;
    const prdFunctions = hasStg ? results[2] : results[1];

    const diffs: PairwiseDiffResult<EdgeFunction>[] = [];
    const counts: { env: string; count: number }[] = [
      { env: 'dev', count: devFunctions.length },
    ];

    if (hasStg && stgFunctions) {
      counts.push({ env: 'stg', count: stgFunctions.length });
      diffs.push({
        pair: 'dev-stg',
        result: compareEdgeFunctions(devFunctions, stgFunctions),
      });
      diffs.push({
        pair: 'stg-prd',
        result: compareEdgeFunctions(stgFunctions, prdFunctions),
      });
    } else {
      diffs.push({
        pair: 'dev-prd',
        result: compareEdgeFunctions(devFunctions, prdFunctions),
      });
    }
    counts.push({ env: 'prd', count: prdFunctions.length });

    return { name: 'Edge Functions', diffs, error: null, counts };
  } catch (error) {
    const err = toError(error);
    err.message = formatErrorMessage(error);
    return { name: 'Edge Functions', diffs: null, error: err, counts: [] };
  }
}

async function checkRlsPoliciesTask(
  inputs: ActionInputs
): Promise<CheckResult<RlsPolicy>> {
  try {
    core.info('Fetching RLS Policies...');
    const hasStg = hasStgEnvironment(inputs);

    const fetchPromises: Promise<RlsPolicy[]>[] = [
      getRlsPolicies(inputs.devDbUrl, inputs.excludedSchemas),
      getRlsPolicies(inputs.prdDbUrl, inputs.excludedSchemas),
    ];
    if (hasStg) {
      fetchPromises.splice(
        1,
        0,
        getRlsPolicies(inputs.stgDbUrl!, inputs.excludedSchemas)
      );
    }

    const results = await Promise.all(fetchPromises);
    const devPolicies = results[0];
    const stgPolicies = hasStg ? results[1] : null;
    const prdPolicies = hasStg ? results[2] : results[1];

    const diffs: PairwiseDiffResult<RlsPolicy>[] = [];
    const counts: { env: string; count: number }[] = [
      { env: 'dev', count: devPolicies.length },
    ];

    if (hasStg && stgPolicies) {
      counts.push({ env: 'stg', count: stgPolicies.length });
      diffs.push({
        pair: 'dev-stg',
        result: compareRlsPolicies(devPolicies, stgPolicies),
      });
      diffs.push({
        pair: 'stg-prd',
        result: compareRlsPolicies(stgPolicies, prdPolicies),
      });
    } else {
      diffs.push({
        pair: 'dev-prd',
        result: compareRlsPolicies(devPolicies, prdPolicies),
      });
    }
    counts.push({ env: 'prd', count: prdPolicies.length });

    return { name: 'RLS Policies', diffs, error: null, counts };
  } catch (error) {
    const err = toError(error);
    err.message = formatErrorMessage(error);
    return { name: 'RLS Policies', diffs: null, error: err, counts: [] };
  }
}

async function checkSqlFunctionsTask(
  inputs: ActionInputs
): Promise<CheckResult<SqlFunction>> {
  try {
    core.info('Fetching SQL Functions...');
    const hasStg = hasStgEnvironment(inputs);

    const fetchPromises: Promise<SqlFunction[]>[] = [
      getSqlFunctions(inputs.devDbUrl, inputs.excludedSchemas),
      getSqlFunctions(inputs.prdDbUrl, inputs.excludedSchemas),
    ];
    if (hasStg) {
      fetchPromises.splice(
        1,
        0,
        getSqlFunctions(inputs.stgDbUrl!, inputs.excludedSchemas)
      );
    }

    const results = await Promise.all(fetchPromises);
    const devFunctions = results[0];
    const stgFunctions = hasStg ? results[1] : null;
    const prdFunctions = hasStg ? results[2] : results[1];

    const diffs: PairwiseDiffResult<SqlFunction>[] = [];
    const counts: { env: string; count: number }[] = [
      { env: 'dev', count: devFunctions.length },
    ];

    if (hasStg && stgFunctions) {
      counts.push({ env: 'stg', count: stgFunctions.length });
      diffs.push({
        pair: 'dev-stg',
        result: compareSqlFunctions(devFunctions, stgFunctions),
      });
      diffs.push({
        pair: 'stg-prd',
        result: compareSqlFunctions(stgFunctions, prdFunctions),
      });
    } else {
      diffs.push({
        pair: 'dev-prd',
        result: compareSqlFunctions(devFunctions, prdFunctions),
      });
    }
    counts.push({ env: 'prd', count: prdFunctions.length });

    return { name: 'SQL Functions', diffs, error: null, counts };
  } catch (error) {
    const err = toError(error);
    err.message = formatErrorMessage(error);
    return { name: 'SQL Functions', diffs: null, error: err, counts: [] };
  }
}

async function checkSchemasTask(
  inputs: ActionInputs
): Promise<CheckResult<TableSchema>> {
  try {
    core.info('Fetching Schemas...');
    const hasStg = hasStgEnvironment(inputs);

    const fetchPromises: Promise<TableSchema[]>[] = [
      getSchemas(inputs.devDbUrl, inputs.excludedSchemas),
      getSchemas(inputs.prdDbUrl, inputs.excludedSchemas),
    ];
    if (hasStg) {
      fetchPromises.splice(
        1,
        0,
        getSchemas(inputs.stgDbUrl!, inputs.excludedSchemas)
      );
    }

    const results = await Promise.all(fetchPromises);
    const devSchemas = results[0];
    const stgSchemas = hasStg ? results[1] : null;
    const prdSchemas = hasStg ? results[2] : results[1];

    const diffs: PairwiseDiffResult<TableSchema>[] = [];
    const counts: { env: string; count: number }[] = [
      { env: 'dev', count: devSchemas.length },
    ];

    if (hasStg && stgSchemas) {
      counts.push({ env: 'stg', count: stgSchemas.length });
      diffs.push({
        pair: 'dev-stg',
        result: compareSchemas(devSchemas, stgSchemas),
      });
      diffs.push({
        pair: 'stg-prd',
        result: compareSchemas(stgSchemas, prdSchemas),
      });
    } else {
      diffs.push({
        pair: 'dev-prd',
        result: compareSchemas(devSchemas, prdSchemas),
      });
    }
    counts.push({ env: 'prd', count: prdSchemas.length });

    return { name: 'Schemas', diffs, error: null, counts };
  } catch (error) {
    const err = toError(error);
    err.message = formatErrorMessage(error);
    return { name: 'Schemas', diffs: null, error: err, counts: [] };
  }
}

function hasDiffInResult<T>(diff: DiffResult<T>): boolean {
  return (
    diff.onlyInDev.length > 0 ||
    diff.onlyInPrd.length > 0 ||
    diff.different.length > 0
  );
}

function hasDiffInPairwise<T>(diffs: PairwiseDiffResult<T>[]): boolean {
  return diffs.some((d) => hasDiffInResult(d.result));
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof AggregateError) {
    const messages = error.errors.map((e: unknown) => {
      if (e instanceof Error) {
        return e.message;
      }
      return String(e);
    });
    return `AggregateError: ${messages.join('; ')}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(formatErrorMessage(error));
}

async function run(): Promise<void> {
  try {
    const inputs = getInputs();
    const hasStg = hasStgEnvironment(inputs);
    const summary: DiffSummary = { hasDiff: false, hasStg };
    const errors: { name: string; error: Error }[] = [];

    core.info('Starting Supabase environment diff check...');
    if (hasStg) {
      core.info('Staging environment detected. Comparing dev -> stg -> prd');
    } else {
      core.info('Comparing dev -> prd (no staging environment)');
    }
    core.info('Running all checks in parallel...');

    // Run all checks in parallel
    const tasks: Promise<CheckResult<unknown>>[] = [];

    if (inputs.checkEdgeFunctions) {
      tasks.push(checkEdgeFunctionsTask(inputs));
    }
    if (inputs.checkRlsPolicies) {
      tasks.push(checkRlsPoliciesTask(inputs));
    }
    if (inputs.checkSqlFunctions) {
      tasks.push(checkSqlFunctionsTask(inputs));
    }
    if (inputs.checkSchemas) {
      tasks.push(checkSchemasTask(inputs));
    }

    const results = await Promise.all(tasks);

    // Process results
    for (const result of results) {
      core.startGroup(result.name);

      if (result.error) {
        core.error(`Error in ${result.name}: ${result.error.message}`);
        core.error(`Stack trace: ${result.error.stack}`);
        errors.push({ name: result.name, error: result.error });
      } else if (result.diffs) {
        const countsStr = result.counts
          .map((c) => `${c.env}: ${c.count}`)
          .join(', ');
        core.info(`Counts: ${countsStr}`);

        if (hasDiffInPairwise(result.diffs as PairwiseDiffResult<unknown>[])) {
          summary.hasDiff = true;
          core.warning(`Differences found in ${result.name}`);
        }

        // Set outputs and summary based on result name
        switch (result.name) {
          case 'Edge Functions':
            summary.edgeFunctions =
              result.diffs as PairwiseDiffResult<EdgeFunction>[];
            core.setOutput(
              'edge_functions_diff',
              JSON.stringify(result.diffs)
            );
            break;
          case 'RLS Policies':
            summary.rlsPolicies =
              result.diffs as PairwiseDiffResult<RlsPolicy>[];
            core.setOutput('rls_policies_diff', JSON.stringify(result.diffs));
            break;
          case 'SQL Functions':
            summary.sqlFunctions =
              result.diffs as PairwiseDiffResult<SqlFunction>[];
            core.setOutput('sql_functions_diff', JSON.stringify(result.diffs));
            break;
          case 'Schemas':
            summary.schemas = result.diffs as PairwiseDiffResult<TableSchema>[];
            core.setOutput('schemas_diff', JSON.stringify(result.diffs));
            break;
        }
      }

      core.endGroup();
    }

    // Report errors
    if (errors.length > 0) {
      core.startGroup('Errors Summary');
      for (const { name, error } of errors) {
        core.error(`${name}: ${error.message}`);
      }
      core.endGroup();
    }

    core.setOutput('has_diff', summary.hasDiff.toString());
    core.setOutput('diff_summary', JSON.stringify(summary));

    // Post PR comment (only if no critical errors)
    if (errors.length === 0) {
      core.startGroup('PR Comment');
      try {
        await postPrComment(inputs.githubToken, summary);
        core.info('Posted PR comment');
      } catch (error) {
        const commentError =
          error instanceof Error ? error : new Error(String(error));
        core.error(`Failed to post PR comment: ${commentError.message}`);
        core.error(`Stack trace: ${commentError.stack}`);
      }
      core.endGroup();
    }

    if (summary.hasDiff) {
      core.warning('Differences detected between environments');

      if (inputs.failOnDiff) {
        core.setFailed(
          'Differences detected between environments (fail_on_diff=true)'
        );
      }
    } else if (errors.length === 0) {
      core.info('No differences between environments');
    }

    // Fail if there were any errors
    if (errors.length > 0) {
      const errorMessages = errors
        .map((e) => `${e.name}: ${e.error.message}`)
        .join('; ');
      core.setFailed(`Errors occurred during checks: ${errorMessages}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Fatal error: ${error.message}`);
      core.error(`Stack trace: ${error.stack}`);
      core.setFailed(error.message);
    } else {
      core.error(`Fatal error: ${String(error)}`);
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
