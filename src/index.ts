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
import { ActionInputs, DiffSummary } from './types';

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

async function run(): Promise<void> {
  try {
    const inputs = getInputs();
    const summary: DiffSummary = { hasDiff: false };

    core.info('Starting Supabase environment diff check...');

    if (inputs.checkEdgeFunctions) {
      core.startGroup('Edge Functions');
      core.info('Fetching Edge Functions...');

      const [devFunctions, prdFunctions] = await Promise.all([
        getEdgeFunctions(inputs.devProjectRef, inputs.supabaseAccessToken),
        getEdgeFunctions(inputs.prdProjectRef, inputs.supabaseAccessToken),
      ]);

      core.info(`dev: ${devFunctions.length}, prod: ${prdFunctions.length}`);

      const diff = compareEdgeFunctions(devFunctions, prdFunctions);
      summary.edgeFunctions = diff;

      if (
        diff.onlyInDev.length > 0 ||
        diff.onlyInPrd.length > 0 ||
        diff.different.length > 0
      ) {
        summary.hasDiff = true;
        core.warning('Differences found in Edge Functions');
      }

      core.setOutput('edge_functions_diff', JSON.stringify(diff));
      core.endGroup();
    }

    if (inputs.checkRlsPolicies) {
      core.startGroup('RLS Policies');
      core.info('Fetching RLS Policies...');

      const [devPolicies, prdPolicies] = await Promise.all([
        getRlsPolicies(inputs.devDbUrl, inputs.excludedSchemas),
        getRlsPolicies(inputs.prdDbUrl, inputs.excludedSchemas),
      ]);

      core.info(`dev: ${devPolicies.length}, prod: ${prdPolicies.length}`);

      const diff = compareRlsPolicies(devPolicies, prdPolicies);
      summary.rlsPolicies = diff;

      if (
        diff.onlyInDev.length > 0 ||
        diff.onlyInPrd.length > 0 ||
        diff.different.length > 0
      ) {
        summary.hasDiff = true;
        core.warning('Differences found in RLS Policies');
      }

      core.setOutput('rls_policies_diff', JSON.stringify(diff));
      core.endGroup();
    }

    if (inputs.checkSqlFunctions) {
      core.startGroup('SQL Functions');
      core.info('Fetching SQL Functions...');

      const [devFunctions, prdFunctions] = await Promise.all([
        getSqlFunctions(inputs.devDbUrl, inputs.excludedSchemas),
        getSqlFunctions(inputs.prdDbUrl, inputs.excludedSchemas),
      ]);

      core.info(`dev: ${devFunctions.length}, prod: ${prdFunctions.length}`);

      const diff = compareSqlFunctions(devFunctions, prdFunctions);
      summary.sqlFunctions = diff;

      if (
        diff.onlyInDev.length > 0 ||
        diff.onlyInPrd.length > 0 ||
        diff.different.length > 0
      ) {
        summary.hasDiff = true;
        core.warning('Differences found in SQL Functions');
      }

      core.setOutput('sql_functions_diff', JSON.stringify(diff));
      core.endGroup();
    }

    if (inputs.checkSchemas) {
      core.startGroup('Schemas');
      core.info('Fetching Schemas...');

      const [devSchemas, prdSchemas] = await Promise.all([
        getSchemas(inputs.devDbUrl, inputs.excludedSchemas),
        getSchemas(inputs.prdDbUrl, inputs.excludedSchemas),
      ]);

      core.info(`dev: ${devSchemas.length}, prod: ${prdSchemas.length}`);

      const diff = compareSchemas(devSchemas, prdSchemas);
      summary.schemas = diff;

      if (
        diff.onlyInDev.length > 0 ||
        diff.onlyInPrd.length > 0 ||
        diff.different.length > 0
      ) {
        summary.hasDiff = true;
        core.warning('Differences found in Schemas');
      }

      core.setOutput('schemas_diff', JSON.stringify(diff));
      core.endGroup();
    }

    core.setOutput('has_diff', summary.hasDiff.toString());
    core.setOutput('diff_summary', JSON.stringify(summary));

    core.startGroup('PR Comment');
    await postPrComment(inputs.githubToken, summary);
    core.info('Posted PR comment');
    core.endGroup();

    if (summary.hasDiff) {
      core.warning('Differences detected between environments');

      if (inputs.failOnDiff) {
        core.setFailed('Differences detected between environments (fail_on_diff=true)');
      }
    } else {
      core.info('No differences between environments');
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
