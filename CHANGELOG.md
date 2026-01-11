# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-01-11

### Added

- Edge Functions diff detection
  - Function existence check
  - Version difference detection
  - Status difference detection

- RLS Policies diff detection
  - Policy existence check
  - Permissive setting detection
  - Roles configuration detection
  - USING clause (qual) detection
  - WITH CHECK clause detection

- SQL Functions diff detection
  - Function existence check
  - Return type detection
  - Language setting detection
  - SECURITY DEFINER setting detection
  - Volatility setting detection
  - Function body definition detection

- Schemas (table structure) diff detection
  - Table existence check
  - Column definition detection (type, nullability, defaults)
  - Index detection
  - Constraint detection (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK)

- Pull Request comment feature
  - Readable Markdown-formatted diff report
  - Existing comment update support
  - Collapsible diff details

- Configuration options
  - Selectable check targets (Edge Functions, RLS, SQL Functions, Schemas)
  - Excluded schemas specification
  - CI failure option on diff detection

- GitHub Actions outputs
  - `has_diff`: Boolean flag for difference existence
  - `diff_summary`: JSON summary of all differences
  - Detailed JSON output for each check type

[Unreleased]: https://github.com/anies1212/supabase-diff-action/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/anies1212/supabase-diff-action/releases/tag/v0.1.0
