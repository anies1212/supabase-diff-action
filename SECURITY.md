# Security Policy

## Supported Versions

Currently supported versions for security updates:

| Version | Supported |
| ------- | --------- |
| 1.x.x   | :white_check_mark: Supported |

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not create a public issue**.

### How to Report

1. Use **GitHub Security Advisory** to report privately
   - Go to the repository's "Security" tab > "Report a vulnerability"

2. Or contact the maintainers directly

### Information to Include

- Detailed description of the vulnerability
- Steps to reproduce
- Affected versions
- If possible, a suggested fix

### Response Process

1. We will acknowledge receipt within 48 hours
2. We will assess the vulnerability and determine severity
3. We will create a fix patch
4. We will release the fix and publish a security advisory

## Security Best Practices

When using this Action, please follow these best practices:

### Secret Management

- Always store **Supabase Access Token** and **Database URL** in GitHub Secrets
- Never output secrets to logs
- Never hardcode secrets in your code

### Minimal Permissions

```yaml
permissions:
  contents: read
  pull-requests: write  # Required for PR comments
```

### Database Connections

- Consider using a read-only database user for production connections
- Use database users with minimal required permissions

## Known Security Considerations

### Database Connection Information

This Action connects to both dev and prod environment databases.
Connection URLs contain passwords, so manage them appropriately.

### API Tokens

Supabase Management API tokens can perform project management operations.
Verify the token's permission scope and use tokens with minimal required permissions.

## Dependency Security

This project regularly checks dependencies for vulnerabilities.

```bash
npm audit
```

Critical vulnerabilities will be patched promptly.
