---
name: cybersecurity-audit
description: Use when reviewing code for security vulnerabilities, before production releases, after security incidents, or when asked to audit code safety. Scans for XSS, SQL injection, command injection, SSRF, path traversal, auth bypass, and data exposure.
---

# Cybersecurity Audit

## Overview

Security vulnerabilities hide in plain sight. A single `dangerouslySetInnerHTML`, an unparameterized query, or a missing auth guard can compromise the entire system. This skill systematically scans code for exploitable vulnerabilities.

**Core principle:** Assume every input is hostile. Trust nothing from the client, the network, or the filesystem.

## When to Use

- Before production releases (security gate)
- After a security incident or CVE disclosure
- When reviewing code that handles user input
- When adding new API endpoints or routes
- When integrating third-party services or webhooks
- When asked to "check for security issues"
- Periodically on critical paths (auth, payments, file uploads)

## The Scan Layers

Run scans in order. Each layer catches different vulnerability classes.

### Layer 1: Input Injection (XSS)

User-controlled data rendered in the browser without sanitization.

| Pattern | What to Look For | Severity |
|---------|-----------------|----------|
| `dangerouslySetInnerHTML` | Any usage in React components | **Critical** |
| `v-html` | Vue directive with user data | **Critical** |
| `innerHTML` / `outerHTML` | Direct DOM manipulation with variables | **Critical** |
| `document.write()` | Writing user data to DOM | **Critical** |
| `eval()` | Executing string as code | **Critical** |
| `new Function()` | Dynamic function from string | **Critical** |
| `href="javascript:"` | User-controlled href attributes | **High** |
| `srcdoc` on iframes | User-controlled iframe content | **High** |
| Template literals in JSX | `` `<div>{userInput}</div>` `` is safe, but watch for attribute injection | **Medium** |

**React-specific checks:**
```bash
# Find dangerouslySetInnerHTML usage
rg 'dangerouslySetInnerHTML' --type tsx

# Find direct DOM writes with variables
rg 'innerHTML\s*=' --type ts
rg 'document\.write' --type ts

# Find eval/Function constructors
rg '\beval\s*\(' --type ts
rg 'new\s+Function\s*\(' --type ts
```

**Fix patterns:**
- Use DOMPurify for HTML sanitization: `DOMPurify.sanitize(userInput)`
- Never use `dangerouslySetInnerHTML` with raw user input
- Use text nodes instead of HTML when possible
- Validate and escape all URL attributes

### Layer 2: Database Injection (SQL/NoSQL)

User input reaching query engines without parameterization.

| Pattern | What to Look For | Severity |
|---------|-----------------|----------|
| String concatenation in queries | `` `SELECT * FROM users WHERE id = '${id}'` `` | **Critical** |
| Template literals in SQL | Any `${}` inside SQL strings | **Critical** |
| Raw query with user input | `db.query(sql, [userInput])` — check if userInput is in the SQL string | **Critical** |
| Dynamic table/column names | `SELECT * FROM ${tableName}` from user input | **High** |
| ORM raw queries without escaping | `prisma.$queryRawUnsafe()` | **High** |
| NoSQL injection | `db.find({ field: req.body.value })` without validation | **High** |

**Drizzle ORM checks (gaqno stack):**
```bash
# Find raw SQL in drizzle
rg 'db\.execute\(' --type ts
rg 'sql\`' --type ts
rg '\.raw\(' --type ts

# Check for string interpolation in queries
rg 'SELECT.*\$\{' --type ts
rg 'WHERE.*\$\{' --type ts
rg 'INSERT.*\$\{' --type ts
```

**Fix patterns:**
- Always use parameterized queries (Drizzle handles this by default)
- Use Drizzle's query builder, not raw SQL
- Validate all inputs with `class-validator` before reaching DB layer
- Whitelist dynamic table/column names against a known set

### Layer 3: Command Injection

User input reaching shell or OS commands.

| Pattern | What to Look For | Severity |
|---------|-----------------|----------|
| `child_process.exec()` | With user-controlled arguments | **Critical** |
| `child_process.execSync()` | With user-controlled arguments | **Critical** |
| `spawn` with `shell: true` | User input in args | **Critical** |
| `system()` / `popen()` | Any usage with variables | **Critical** |
| Dynamic `require()` / `import()` | `require(req.body.module)` | **Critical** |
| Path construction from user input | `path.join(uploadDir, req.body.filename)` | **High** |

```bash
# Find child_process usage
rg 'child_process' --type ts
rg 'exec\s*\(' --type ts
rg 'execSync\s*\(' --type ts
rg 'spawn\s*\(' --type ts

# Find dynamic imports
rg 'require\s*\(' --type ts | rg -v 'node_modules' | rg -v '^import'
rg 'import\s*\(' --type ts
```

**Fix patterns:**
- Use `execFile` or `spawn` with `shell: false` and argument arrays
- Never pass user input to shell commands
- Validate filenames against allowlists (alphanumeric + limited special chars)
- Use `path.resolve()` and verify the result stays within expected directory

### Layer 4: Path Traversal & File Upload

User-controlled file paths or uploads reaching the filesystem.

| Pattern | What to Look For | Severity |
|---------|-----------------|----------|
| `../` in paths | User input containing path traversal sequences | **Critical** |
| File upload without type validation | Accepting any file type | **High** |
| File upload without size limit | Unbounded upload size | **Medium** |
| Symlink following | Reading files that could be symlinks | **High** |
| Static file serving from user paths | `res.sendFile(userPath)` | **Critical** |

```bash
# Find file system operations with user input
rg 'fs\.(read|write|append|unlink|rename|mkdir)' --type ts
rg 'res\.sendFile' --type ts
rg 'res\.download' --type ts
rg 'path\.join.*req' --type ts

# Find file upload handlers
rg 'multer' --type ts
rg 'upload' --type ts
rg 'multipart' --type ts
```

**Fix patterns:**
- Use `path.resolve()` then verify result starts with expected base directory
- Validate file extensions against allowlist
- Set max file size limits
- Generate random filenames for stored files, never use user-provided names
- Check for `..` sequences: `if (filename.includes('..')) throw new Error()`

### Layer 5: Authentication & Authorization

Missing or bypassable access controls.

| Pattern | What to Look For | Severity |
|---------|-----------------|----------|
| Routes without auth guards | Endpoints that modify data without `@UseGuards()` | **Critical** |
| IDOR (Insecure Direct Object Reference) | `GET /orders/:id` without checking ownership | **Critical** |
| Missing role checks | Admin actions accessible to regular users | **Critical** |
| JWT validation skipped | `jwt.verify` with `{ ignoreExpiration: true }` | **Critical** |
| Hardcoded credentials | Passwords, API keys, secrets in code | **Critical** |
| CSRF missing on state-changing routes | POST/PUT/DELETE without CSRF tokens | **High** |
| Session fixation | Not regenerating session after login | **High** |

```bash
# Find routes without guards
rg '@(Post|Put|Delete|Patch)\(' --type ts -A 3 | rg -v 'UseGuards'

# Find hardcoded secrets
rg '(password|secret|api_key|token)\s*=\s*["\x27]' --type ts
rg 'AWS_SECRET|PRIVATE_KEY|DATABASE_URL.*:' --type ts

# Find JWT config
rg 'ignoreExpiration' --type ts
rg 'ignoreNotBefore' --type ts
```

**Fix patterns (gaqno stack):**
- Use `@UseGuards(JwtAuthGuard)` on all protected routes
- Check resource ownership: `if (order.userId !== user.id) throw ForbiddenException`
- Use `@Roles('admin')` for admin-only endpoints
- Store secrets in environment variables, never in code
- Use `class-validator` to validate all DTOs

### Layer 6: SSRF & Open Redirect

Server making requests to user-controlled URLs.

| Pattern | What to Look For | Severity |
|---------|-----------------|----------|
| `fetch(userUrl)` | Server fetching user-provided URLs | **Critical** |
| `axios.get(userUrl)` | Same with axios | **Critical** |
| `http.request(userUrl)` | Node.js HTTP with user URL | **Critical** |
| `res.redirect(userUrl)` | Redirecting to user-controlled URL | **High** |
| Webhook URLs from user input | Storing/using user-provided webhook URLs | **High** |

```bash
# Find server-side HTTP requests
rg 'fetch\s*\(' --type ts | rg -v 'node_modules' | rg -v 'test'
rg 'axios\.(get|post|put|delete)' --type ts
rg 'http\.request' --type ts
rg 'https\.request' --type ts

# Find redirects with user input
rg 'res\.redirect' --type ts
rg 'res\.status\(30' --type ts
```

**Fix patterns:**
- Whitelist allowed domains for server-side requests
- Block internal IPs: `127.0.0.1`, `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`, `169.254.x.x`
- Use URL parsing to validate scheme (only `https://`)
- For redirects, use a allowlist of known paths or domains

### Layer 7: Data Exposure & Logging

Sensitive data leaking in responses, logs, or errors.

| Pattern | What to Look For | Severity |
|---------|-----------------|----------|
| Returning full user objects | `res.json(user)` including password hash | **High** |
| Logging sensitive data | `console.log(password, token, creditCard)` | **High** |
| Stack traces in production | Error responses with stack traces | **Medium** |
| CORS wildcard | `Access-Control-Allow-Origin: *` with credentials | **High** |
| Verbose error messages | `"Invalid password for user john@example.com"` | **Medium** |

```bash
# Find logging of sensitive data
rg 'console\.(log|error).*password' --type ts
rg 'console\.(log|error).*token' --type ts
rg 'console\.(log|error).*secret' --type ts
rg 'console\.(log|error).*credit' --type ts

# Find CORS config
rg 'cors\s*\(' --type ts
rg 'Access-Control-Allow-Origin' --type ts

# Find error responses with stack
rg 'res\.json.*stack' --type ts
rg 'res\.json.*error.*message' --type ts
```

**Fix patterns:**
- Use DTOs/serializers to strip sensitive fields before response
- Never log passwords, tokens, PII, or payment data
- Use a global exception filter that sanitizes error responses
- Set specific CORS origins, never `*` with credentials

## The Scan Process

### Step 1: Scope Definition

Identify what to scan:
- **Single file**: Direct review
- **Feature**: All files in the feature directory
- **PR**: Files changed in the diff
- **Full codebase**: All source files

### Step 2: Automated Scan

Run the grep patterns from each layer above. Collect all matches.

### Step 3: Contextual Analysis

For each match, determine:
1. Is the data user-controlled? (from `req.body`, `req.query`, `req.params`, URL, form)
2. Does it reach a sensitive sink? (DOM, DB, filesystem, network, shell)
3. Is there validation/sanitization between source and sink?

### Step 4: Report

Present findings in this format:

```
## Security Audit Report: <scope>

### Critical (exploitable now — fix immediately)
- [ ] <file>:<line> - <vulnerability type> — <attack vector> — <fix>

### High (exploitable with conditions — fix this sprint)
- [ ] <file>:<line> - <vulnerability type> — <attack vector> — <fix>

### Medium (defense in depth — fix soon)
- [ ] <file>:<line> - <vulnerability type> — <why it matters> — <fix>

### Low (hardening — track for later)
- [ ] <file>:<line> - <vulnerability type> — <recommendation>
```

## Project-Specific Rules (gaqno)

| Rule | Check |
|------|-------|
| All DTOs use `class-validator` | No raw `req.body` access in controllers |
| All protected routes have `@UseGuards(JwtAuthGuard)` | No unguarded mutations |
| Drizzle queries use query builder | No raw SQL with user input |
| No secrets in code | All secrets via `process.env` |
| Error responses sanitized | Global exception filter in place |
| CORS configured per environment | No `*` origin |
| File uploads validated | Type + size limits enforced |
| User data serialized | Passwords, tokens stripped from responses |

## Quick Reference: Severity Definitions

| Severity | Definition | SLA |
|----------|-----------|-----|
| **Critical** | Directly exploitable, no special conditions needed | Block release |
| **High** | Exploitable with some conditions or knowledge | Fix within 1 sprint |
| **Medium** | Defense-in-depth issue, reduces attack surface | Fix within 1 month |
| **Low** | Hardening recommendation, not immediately exploitable | Track in backlog |

## Red Flags — Never Skip This Audit Because:

- "It's an internal endpoint" — insiders cause breaches too
- "The user is authenticated" — auth doesn't prevent injection
- "It's just a log statement" — logs leak to monitoring, support tools, backups
- "The input is validated" — validation ≠ sanitization, check the validation rules
- "We use an ORM" — raw queries bypass ORM protection
- "It's behind a firewall" — SSRF bypasses network boundaries
- "It's only in dev/test" — test code gets copied to production
