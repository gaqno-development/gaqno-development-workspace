# Dokploy MCP Resources

All resources are read-only and return content as `text/markdown`. They provide quick access to project, application, database, and domain data without invoking tools.

---

## Fixed Resources (3)

| URI | Name | Description |
|-----|------|-------------|
| `dokploy://projects` | All Projects | Markdown table of all projects with service counts |
| `dokploy://applications` | All Applications | All applications across all projects |
| `dokploy://databases` | All Databases | All databases (MySQL, PostgreSQL, Redis, MariaDB, MongoDB) |

---

## Resource Templates (3)

| URI Template | Name | Description |
|--------------|------|-------------|
| `dokploy://project/{projectId}` | Project Details | Detailed view of a project with all its services |
| `dokploy://application/{applicationId}` | Application Details | Application configuration and status |
| `dokploy://domain/{domainId}` | Domain Details | Domain routing configuration |

Replace `{projectId}`, `{applicationId}`, or `{domainId}` with the actual Dokploy ID.

---

## Example Output

### Projects Listing (`dokploy://projects`)

Resources return structured markdown. Example for a projects listing:

```markdown
# All Projects

| ID | Name | Description | Applications | Databases |
|----|------|-------------|--------------|-----------|
| abc123 | My App | Main production project | 3 | 2 |
| def456 | Staging | Staging environment | 1 | 1 |
| ghi789 | Dev | Development sandbox | 2 | 0 |

*Last updated: 2025-03-17*
```

### Application Details (`dokploy://application/{applicationId}`)

```markdown
# Application: my-web-app

| Field | Value |
|-------|-------|
| ID | xyz789 |
| Project | My App (abc123) |
| Status | running |
| Image | nginx:latest |

## Environment Variables
- `NODE_ENV`: production
- `DATABASE_URL`: ***
```

### Database Details (`dokploy://databases`)

```markdown
# All Databases

## MySQL
| Name | Project | Status |
|------|---------|--------|
| main-db | My App | running |

## PostgreSQL
| Name | Project | Status |
|------|---------|--------|
| analytics | Staging | running |
```

---

## Usage

- **MCP clients**: Request resources by URI. For templated resources, substitute the placeholder with a valid ID.
- **Cursor / Claude**: Resources appear in the resource list; selecting one fetches the current markdown content.
- Content is fetched on demand from the Dokploy API at request time.
