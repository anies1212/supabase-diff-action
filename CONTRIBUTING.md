# Contributing Guide

Thank you for your interest in contributing to supabase-diff-action!

## Development Environment Setup

### Requirements

- Node.js 20.x or higher
- npm 9.x or higher

### Setup Steps

```bash
# Fork and clone the repository
git clone https://github.com/your-username/supabase-diff-action.git
cd supabase-diff-action

# Install dependencies
npm install

# Run build
npm run build
```

## Development Workflow

### Branch Strategy

- `main`: Stable release branch
- `feature/*`: New feature development
- `fix/*`: Bug fixes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
feat: add new feature
fix: fix a bug
docs: documentation only changes
refactor: code refactoring
test: add or update tests
chore: build process or tool changes
```

### Creating a Pull Request

1. Create a new branch from your fork
2. Implement your changes
3. Add/run tests
4. Ensure build succeeds
5. Create a pull request

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# After implementing changes, run tests and build
npm run typecheck
npm run test
npm run build

# Commit changes
git add .
git commit -m "feat: description of feature"

# Push
git push origin feature/your-feature-name
```

## Code Style

### TypeScript

- Strict type checking is enabled (`strict: true`)
- Avoid using `any`
- Add appropriate type annotations to functions

### Formatting

- Indent: 2 spaces
- Semicolons: required
- Quotes: single quotes

## Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test -- --watch
```

When adding new features, please add corresponding tests.

## Building

```bash
# Run build
npm run build

# Type check only
npm run typecheck
```

**Important**: Before creating a pull request, always run `npm run build` and commit the changes to the `dist/` directory.

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Environment information (Node.js version, OS, etc.)
5. Error messages (if any)

### Feature Requests

When requesting features, please describe:

1. The problem you're trying to solve
2. Your proposed solution
3. Alternative solutions (if any)

## Code of Conduct

We expect all participants to treat each other with respect.
Harassment and discriminatory behavior will not be tolerated.

## License

Contributions are provided under the MIT License.
