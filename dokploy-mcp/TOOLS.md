# Dokploy MCP Tools

All 59 tools organized by category. Each tool maps to Dokploy API endpoints and supports the MCP tool-calling protocol.

---

## Projects (6 tools)

| Tool | Description | Required | Optional |
|------|-------------|----------|----------|
| `project-list-all` | List all Dokploy projects | none | — |
| `project-get-one` | Get details of a single project by ID | `projectId` | — |
| `project-create` | Create a new Dokploy project | `name` | `description` |
| `project-update` | Update an existing project | `projectId` | `name`, `description` |
| `project-delete` | Remove a Dokploy project | `projectId` | — |
| `project-duplicate` | Clone an existing project | `projectId` | — |

---

## Applications (10 tools)

| Tool | Description | Required | Optional |
|------|-------------|----------|----------|
| `application-create` | Create a new application within a project | `name`, `projectId` | `description` |
| `application-get-one` | Get details of a single application | `applicationId` | — |
| `application-update` | Update application configuration | `applicationId` | Any application fields |
| `application-deploy` | Deploy an application to its target environment | `applicationId` | — |
| `application-redeploy` | Redeploy an application with current configuration | `applicationId` | — |
| `application-start` | Start a stopped application | `applicationId` | — |
| `application-stop` | Stop a running application | `applicationId` | — |
| `application-delete` | Delete an application and its resources | `applicationId` | — |
| `application-save-environment` | Save environment variables for an application | `applicationId`, `env` | — |
| `application-restart` | Restart a running application | `applicationId` | — |

---

## MySQL (7 tools)

| Tool | Description | Required | Optional |
|------|-------------|----------|----------|
| `mysql-create` | Create a new MySQL database instance | `name`, `projectId` | `databaseName`, `databaseUser`, `databasePassword`, `databaseRootPassword`, `dockerImage`, `description` |
| `mysql-get-one` | Get details of a MySQL database instance | `mysqlId` | — |
| `mysql-update` | Update MySQL database configuration | `mysqlId` | Any MySQL fields |
| `mysql-deploy` | Deploy a MySQL database instance | `mysqlId` | — |
| `mysql-start` | Start a MySQL database instance | `mysqlId` | — |
| `mysql-stop` | Stop a MySQL database instance | `mysqlId` | — |
| `mysql-remove` | Remove a MySQL database instance | `mysqlId` | — |

---

## PostgreSQL (7 tools)

| Tool | Description | Required | Optional |
|------|-------------|----------|----------|
| `postgres-create` | Create a new PostgreSQL database instance | `name`, `projectId` | `databaseName`, `databaseUser`, `databasePassword`, `databaseRootPassword`, `dockerImage`, `description` |
| `postgres-get-one` | Get details of a PostgreSQL database instance | `postgresId` | — |
| `postgres-update` | Update PostgreSQL database configuration | `postgresId` | Any PostgreSQL fields |
| `postgres-deploy` | Deploy a PostgreSQL database instance | `postgresId` | — |
| `postgres-start` | Start a PostgreSQL database instance | `postgresId` | — |
| `postgres-stop` | Stop a PostgreSQL database instance | `postgresId` | — |
| `postgres-remove` | Remove a PostgreSQL database instance | `postgresId` | — |

---

## Redis (6 tools)

| Tool | Description | Required | Optional |
|------|-------------|----------|----------|
| `redis-create` | Create a new Redis instance | `name`, `projectId` | `description`, `databasePassword`, `dockerImage` |
| `redis-get-one` | Get details of a Redis instance | `redisId` | — |
| `redis-deploy` | Deploy a Redis instance | `redisId` | — |
| `redis-start` | Start a Redis instance | `redisId` | — |
| `redis-stop` | Stop a Redis instance | `redisId` | — |
| `redis-remove` | Remove a Redis instance | `redisId` | — |

---

## MariaDB (6 tools)

| Tool | Description | Required | Optional |
|------|-------------|----------|----------|
| `mariadb-create` | Create a new MariaDB database instance | `name`, `projectId` | `databaseName`, `databaseUser`, `databasePassword`, `databaseRootPassword`, `dockerImage`, `description` |
| `mariadb-get-one` | Get details of a MariaDB database instance | `mariadbId` | — |
| `mariadb-deploy` | Deploy a MariaDB database instance | `mariadbId` | — |
| `mariadb-start` | Start a MariaDB database instance | `mariadbId` | — |
| `mariadb-stop` | Stop a MariaDB database instance | `mariadbId` | — |
| `mariadb-remove` | Remove a MariaDB database instance | `mariadbId` | — |

---

## MongoDB (6 tools)

| Tool | Description | Required | Optional |
|------|-------------|----------|----------|
| `mongo-create` | Create a new MongoDB instance | `name`, `projectId` | `description`, `databaseUser`, `databasePassword`, `dockerImage` |
| `mongo-get-one` | Get details of a MongoDB instance | `mongoId` | — |
| `mongo-deploy` | Deploy a MongoDB instance | `mongoId` | — |
| `mongo-start` | Start a MongoDB instance | `mongoId` | — |
| `mongo-stop` | Stop a MongoDB instance | `mongoId` | — |
| `mongo-remove` | Remove a MongoDB instance | `mongoId` | — |

---

## Domains (6 tools)

| Tool | Description | Required | Optional |
|------|-------------|----------|----------|
| `domain-create` | Create a domain mapping for an application | `host`, `applicationId` | `path`, `port`, `https`, `certificateType` |
| `domain-get-one` | Get details of a domain configuration | `domainId` | — |
| `domain-update` | Update domain configuration | `domainId` | Any domain fields |
| `domain-delete` | Delete a domain mapping | `domainId` | — |
| `domain-list-by-app` | List all domains configured for an application | `applicationId` | — |
| `domain-generate` | Auto-generate a domain configuration for an application | `applicationId` | — |

---

## AI Configurations (5 tools)

| Tool | Description | Required | Optional |
|------|-------------|----------|----------|
| `ai-list-all` | List all AI configuration entries in Dokploy | none | — |
| `ai-get-one` | Get details of a single AI configuration | `aiId` | — |
| `ai-create` | Create a new AI configuration | (any config fields) | — |
| `ai-update` | Update an AI configuration | (any config fields) | — |
| `ai-delete` | Delete an AI configuration | `aiId` | — |

---

## Parameter Notes

- **ID parameters** (`projectId`, `applicationId`, `mysqlId`, etc.) are string UUIDs returned by Dokploy.
- **Passthrough tools** (`application-update`, `mysql-update`, `postgres-update`, `domain-update`) accept the ID plus any additional fields the API supports.
- **Database create tools** accept optional credentials; if omitted, Dokploy generates defaults.
- **`env` in `application-save-environment`** is a JSON string of environment variables, e.g. `{"KEY1":"value1","KEY2":"value2"}`.
