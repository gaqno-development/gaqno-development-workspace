# Dokploy MCP Prompts

Interactive prompt templates guide the AI through multi-step workflows. Each prompt accepts arguments and defines steps for listing, selecting, verifying, and performing actions.

---

## deploy-application

**Description:** Deploy an application to a Dokploy project. Guides through listing projects, selecting an app, verifying settings, and deploying.

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `projectName` | No | Name or ID of the project |
| `applicationName` | No | Name or ID of the application |

### Workflow Steps

1. List all projects (optionally filter by `projectName`)
2. If `applicationName` is not provided, list applications in the selected project and ask the user to choose
3. Retrieve application details and verify configuration
4. Deploy the application and report the result

---

## provision-database

**Description:** Create and configure a new database (MySQL, PostgreSQL, Redis, MariaDB, or MongoDB) in a Dokploy project.

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `projectId` | Yes | Target project ID |
| `dbType` | Yes | Database type: `mysql`, `postgres`, `redis`, `mariadb`, or `mongo` |
| `name` | Yes | Database instance name |

### Workflow Steps

1. Create the database instance with the specified name and type
2. Deploy the database
3. Start the database
4. Return connection details (host, port, credentials) if available

---

## list-and-manage-apps

**Description:** View all applications across projects and perform actions (start, stop, deploy, restart) on a selected one.

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `filter` | No | Optional filter (e.g. project name, status) |

### Workflow Steps

1. List all applications across projects
2. Optionally filter by `filter`
3. Present the list to the user
4. Allow the user to select an application and choose an action (start, stop, deploy, restart)
5. Execute the chosen action and report the result

---

## scale-application

**Description:** Update resource limits (memory, CPU) for an application and restart it.

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `applicationId` | Yes | Application ID to scale |
| `memoryLimit` | No | New memory limit (e.g. `512m`, `1g`) |
| `cpuLimit` | No | New CPU limit (e.g. `0.5`, `1`) |

### Workflow Steps

1. Fetch the application by `applicationId`
2. Update configuration with `memoryLimit` and/or `cpuLimit` if provided
3. Restart the application to apply changes
4. Confirm the new resource limits and status

---

## Usage

Prompts are invoked by name from MCP clients. The AI receives the prompt template and arguments, then follows the described steps using the available tools and resources.
