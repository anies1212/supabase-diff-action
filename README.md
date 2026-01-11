# Supabase Diff Action

[![GitHub release](https://img.shields.io/github/v/release/anies1212/supabase-diff-action)](https://github.com/anies1212/supabase-diff-action/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)

A GitHub Action that detects differences between Supabase environments (e.g., dev/prod) and reports them as Pull Request comments.

Catch deployment discrepancies and environment inconsistencies early to maintain production stability.

## Features

- **Edge Functions** - Detect existence and version differences
- **RLS Policies** - Detect Row Level Security policy definition differences
- **SQL Functions** - Detect PostgreSQL function definition differences
- **Schemas** - Detect table structure differences (columns, indexes, constraints)
- Post readable Markdown-formatted comments to Pull Requests
- Option to fail CI when differences are detected

## Quick Start

### 1. Configure Secrets

In your repository's Settings > Secrets and variables > Actions, add:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SUPABASE_ACCESS_TOKEN` | Management API token | [Supabase Dashboard](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_DEV_PROJECT_REF` | Dev environment project ref | Project Settings > General |
| `SUPABASE_DEV_DB_URL` | Dev environment DB connection URL | Project Settings > Database |
| `SUPABASE_PRD_PROJECT_REF` | Prod environment project ref | Project Settings > General |
| `SUPABASE_PRD_DB_URL` | Prod environment DB connection URL | Project Settings > Database |

### 2. Create Workflow File

`.github/workflows/supabase-diff.yml`:

```yaml
name: Supabase Diff Check

on:
  pull_request:
    branches: [main]

jobs:
  diff-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: anies1212/supabase-diff-action@v1
        with:
          supabase_access_token: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          dev_project_ref: ${{ secrets.SUPABASE_DEV_PROJECT_REF }}
          dev_db_url: ${{ secrets.SUPABASE_DEV_DB_URL }}
          prd_project_ref: ${{ secrets.SUPABASE_PRD_PROJECT_REF }}
          prd_db_url: ${{ secrets.SUPABASE_PRD_DB_URL }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

### Required Inputs

| Input | Description |
|-------|-------------|
| `supabase_access_token` | Supabase Management API access token |
| `dev_project_ref` | Dev environment project reference |
| `dev_db_url` | Dev environment PostgreSQL connection URL |
| `prd_project_ref` | Prod environment project reference |
| `prd_db_url` | Prod environment PostgreSQL connection URL |
| `github_token` | GitHub Token (for PR comments) |

### Optional Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `check_edge_functions` | `true` | Check Edge Functions |
| `check_rls_policies` | `true` | Check RLS Policies |
| `check_sql_functions` | `true` | Check SQL Functions |
| `check_schemas` | `true` | Check Schemas |
| `fail_on_diff` | `false` | Fail the action if differences are found |
| `excluded_schemas` | (※1) | Comma-separated list of schemas to exclude |

※1: Default excluded schemas: `pg_catalog`, `information_schema`, `extensions`, `pg_toast`, `pgsodium`, `vault`, `graphql`, `graphql_public`

## Outputs

| Output | Description |
|--------|-------------|
| `has_diff` | Whether differences were found (`true`/`false`) |
| `diff_summary` | Diff summary (JSON) |
| `edge_functions_diff` | Edge Functions diff (JSON) |
| `rls_policies_diff` | RLS Policies diff (JSON) |
| `sql_functions_diff` | SQL Functions diff (JSON) |
| `schemas_diff` | Schemas diff (JSON) |

### Using Outputs

```yaml
- uses: anies1212/supabase-diff-action@v1
  id: diff
  with:
    # ... inputs

- name: Handle differences
  if: steps.diff.outputs.has_diff == 'true'
  run: echo "Differences found between environments"
```

## PR Comment Example

When differences are detected, a comment like this is posted to the PR:

---

### Supabase Environment Diff

Differences detected between dev and prod environments.

#### Edge Functions

| Function | dev | prod | Status |
|----------|-----|------|--------|
| send-email | v3 | v2 | version: 3 → 2 |
| new-feature | v1 | - | Only in dev |

#### RLS Policies

| Table | Policy | dev | prod | Status |
|-------|--------|-----|------|--------|
| public.users | select_own | ✓ | ✓ | qual: definition differs |

#### SQL Functions

| Schema | Function | dev | prod | Status |
|--------|----------|-----|------|--------|
| public | calculate_total(integer) | ✓ | ✓ | definition: differs |

#### Schemas

| Schema | Table | dev | prod | Status |
|--------|-------|-----|------|--------|
| public | orders | ✓ | ✓ | Has differences |

<details>
<summary>Diff Details</summary>

##### public.orders

- column "discount" data_type: numeric → integer
- index "orders_user_id_idx": only in dev

</details>

---

## Advanced Usage

### Run Specific Checks Only

```yaml
- uses: anies1212/supabase-diff-action@v1
  with:
    # ... required inputs
    check_edge_functions: 'true'
    check_rls_policies: 'true'
    check_sql_functions: 'false'  # Skip SQL Functions
    check_schemas: 'false'         # Skip Schemas
```

### Fail CI on Differences

```yaml
- uses: anies1212/supabase-diff-action@v1
  with:
    # ... required inputs
    fail_on_diff: 'true'
```

### Exclude Specific Schemas

```yaml
- uses: anies1212/supabase-diff-action@v1
  with:
    # ... required inputs
    excluded_schemas: 'pg_catalog,information_schema,extensions,my_internal_schema'
```

## Development

### Requirements

- Node.js 20.x
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/anies1212/supabase-diff-action.git
cd supabase-diff-action

# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck

# Test
npm run test
```

### Directory Structure

```
supabase-diff-action/
├── action.yml              # GitHub Action definition
├── src/
│   ├── index.ts            # Entry point
│   ├── types.ts            # Type definitions
│   ├── supabase/
│   │   ├── functions.ts    # Edge Functions fetcher
│   │   ├── rls.ts          # RLS Policies fetcher
│   │   ├── sql-functions.ts # SQL Functions fetcher
│   │   └── schemas.ts      # Table schemas fetcher
│   ├── diff/
│   │   └── compare.ts      # Diff comparison logic
│   └── github/
│       └── comment.ts      # PR comment posting
└── dist/                   # Built files
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Security

If you discover a security vulnerability, please see [SECURITY.md](SECURITY.md).

## License

[MIT License](LICENSE)

## Related Links

- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
