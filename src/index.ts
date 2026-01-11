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
  EdgeFunction,
  RlsPolicy,
  SqlFunction,
  TableSchema,
} from './types';

function getInputs(): ActionInputs {
  return {
    supabaseAccessToken: core.getInput('supabase_access_token', {
      required: true,
    }),
    devProjectRef: core.getInput('dev_project_ref', { required: true }),
    devDbUrl: core.getInput('dev_db_url', { required: true }),
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

interface CheckResult<T> {
  name: string;
  diff: DiffResult<T> | null;
  error: Error | null;
  devCount: number;
  prdCount: number;
}

async function checkEdgeFunctionsTask(
  inputs: ActionInputs
): Promise<CheckResult<EdgeFunction>> {
  try {
    core.info('Fetching Edge Functions...');
    const [devFunctions, prdFunctions] = await Promise.all([
      getEdgeFunctions(inputs.devProjectRef, inputs.supabaseAccessToken),
      getEdgeFunctions(inputs.prdProjectRef, inputs.supabaseAccessToken),
    ]);

    const diff = compareEdgeFunctions(devFunctions, prdFunctions);
    return {
      name: 'Edge Functions',
      diff,
      error: null,
      devCount: devFunctions.length,
      prdCount: prdFunctions.length,
    };
  } catch (error) {
    return {
      name: 'Edge Functions',
      diff: null,
      error: error instanceof Error ? error : new Error(String(error)),
      devCount: 0,
      prdCount: 0,
    };
  }
}

async function checkRlsPoliciesTask(
  inputs: ActionInputs
): Promise<CheckResult<RlsPolicy>> {
  try {
    core.info('Fetching RLS Policies...');
    const [devPolicies, prdPolicies] = await Promise.all([
      getRlsPolicies(inputs.devDbUrl, inputs.excludedSchemas),
      getRlsPolicies(inputs.prdDbUrl, inputs.excludedSchemas),
    ]);

    const diff = compareRlsPolicies(devPolicies, prdPolicies);
    return {
      name: 'RLS Policies',
      diff,
      error: null,
      devCount: devPolicies.length,
      prdCount: prdPolicies.length,
    };
  } catch (error) {
    return {
      name: 'RLS Policies',
      diff: null,
      error: error instanceof Error ? error : new Error(String(error)),
      devCount: 0,
      prdCount: 0,
    };
  }
}

async function checkSqlFunctionsTask(
  inputs: ActionInputs
): Promise<CheckResult<SqlFunction>> {
  try {
    core.info('Fetching SQL Functions...');
    const [devFunctions, prdFunctions] = await Promise.all([
      getSqlFunctions(inputs.devDbUrl, inputs.excludedSchemas),
      getSqlFunctions(inputs.prdDbUrl, inputs.excludedSchemas),
    ]);

    const diff = compareSqlFunctions(devFunctions, prdFunctions);
    return {
      name: 'SQL Functions',
      diff,
      error: null,
      devCount: devFunctions.length,
      prdCount: prdFunctions.length,
    };
  } catch (error) {
    return {
      name: 'SQL Functions',
      diff: null,
      error: error instanceof Error ? error : new Error(String(error)),
      devCount: 0,
      prdCount: 0,
    };
  }
}

async function checkSchemasTask(
  inputs: ActionInputs
): Promise<CheckResult<TableSchema>> {
  try {
    core.info('Fetching Schemas...');
    const [devSchemas, prdSchemas] = await Promise.all([
      getSchemas(inputs.devDbUrl, inputs.excludedSchemas),
      getSchemas(inputs.prdDbUrl, inputs.excludedSchemas),
    ]);

    const diff = compareSchemas(devSchemas, prdSchemas);
    return {
      name: 'Schemas',
      diff,
      error: null,
      devCount: devSchemas.length,
      prdCount: prdSchemas.length,
    };
  } catch (error) {
    return {
      name: 'Schemas',
      diff: null,
      error: error instanceof Error ? error : new Error(String(error)),
      devCount: 0,
      prdCount: 0,
    };
  }
}

function hasDiff<T>(diff: DiffResult<T>): boolean {
  return (
    diff.onlyInDev.length > 0 ||
    diff.onlyInPrd.length > 0 ||
    diff.different.length > 0
  );
}

async function run(): Promise<void> {
  try {
    const inputs = getInputs();
    const summary: DiffSummary = { hasDiff: false };
    const errors: { name: string; error: Error }[] = [];

    core.info('Starting Supabase environment diff check...');
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
      } else if (result.diff) {
        core.info(`dev: ${result.devCount}, prod: ${result.prdCount}`);

        if (hasDiff(result.diff)) {
          summary.hasDiff = true;
          core.warning(`Differences found in ${result.name}`);
        }

        // Set outputs and summary based on result name
        switch (result.name) {
          case 'Edge Functions':
            summary.edgeFunctions = result.diff as DiffResult<EdgeFunction>;
            core.setOutput('edge_functions_diff', JSON.stringify(result.diff));
            break;
          case 'RLS Policies':
            summary.rlsPolicies = result.diff as DiffResult<RlsPolicy>;
            core.setOutput('rls_policies_diff', JSON.stringify(result.diff));
            break;
          case 'SQL Functions':
            summary.sqlFunctions = result.diff as DiffResult<SqlFunction>;
            core.setOutput('sql_functions_diff', JSON.stringify(result.diff));
            break;
          case 'Schemas':
            summary.schemas = result.diff as DiffResult<TableSchema>;
            core.setOutput('schemas_diff', JSON.stringify(result.diff));
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
        const commentError = error instanceof Error ? error : new Error(String(error));
        core.error(`Failed to post PR comment: ${commentError.message}`);
        core.error(`Stack trace: ${commentError.stack}`);
      }
      core.endGroup();
    }

    if (summary.hasDiff) {
      core.warning('Differences detected between environments');

      if (inputs.failOnDiff) {
        core.setFailed('Differences detected between environments (fail_on_diff=true)');
      }
    } else if (errors.length === 0) {
      core.info('No differences between environments');
    }

    // Fail if there were any errors
    if (errors.length > 0) {
      const errorMessages = errors.map((e) => `${e.name}: ${e.error.message}`).join('; ');
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
