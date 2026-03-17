# Dokploy MCP Server

![Node.js 18+](https://img.shields.io/badge/node-18%2B-brightgreen) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

Production-ready MCP (Model Context Protocol) server exposing Dokploy's API as tools, resources, and prompts for AI applications such as Claude, ChatGPT, and Cursor.

## Overview

The Dokploy MCP Server integrates your Dokploy instance with AI-powered development tools. It provides 59+ tools for managing projects, applications, databases, domains, and AI configurations—alongside read-only resources and interactive prompts for common workflows.

## Features

- **59+ tools** covering Projects, Applications, MySQL, PostgreSQL, Redis, MariaDB, MongoDB, Domains, and AI Configurations
- **6 read-only resources** (3 fixed + 3 templated) returning markdown
- **4 interactive prompt templates** for common workflows
- **STDIO transport** for local integration (Cursor, Claude Desktop)
- **HTTP/SSE transport** for remote deployment
- **Bearer token authentication** for HTTP transport
- **Detailed error mapping** (Dokploy API errors → MCP error codes)
- **Docker support** for containerized deployment

## Quick Start

### Prerequisites

- Node.js 18+
- Dokploy API key

### Installation

```bash
cd dokploy-mcp
npm install
npm run build
```

### Run with STDIO (local)

```bash
DOKPLOY_API_KEY=your-api-key npm start
```

### Run with HTTP (remote)

```bash
MCP_TRANSPORT=http DOKPLOY_API_KEY=your-api-key npm start
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DOKPLOY_API_KEY` | (required) | Dokploy API key for authentication |
| `DOKPLOY_BASE_URL` | `http://localhost:3000/api` | Dokploy API base URL |
| `MCP_TRANSPORT` | `stdio` | Transport: `stdio`, `http`, or `both` |
| `MCP_HTTP_PORT` | `3001` | HTTP server port when using HTTP transport |
| `MCP_HTTP_AUTH_TOKEN` | (none) | Bearer token for HTTP transport authentication |
| `LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |

## Cursor IDE Integration

Add the following to your Cursor MCP settings (`.cursor/mcp.json` or Cursor Settings → MCP):

```json
{
  "mcpServers": {
    "dokploy": {
      "command": "node",
      "args": ["/path/to/dokploy-mcp/dist/index.js"],
      "env": {
        "DOKPLOY_API_KEY": "your-key",
        "DOKPLOY_BASE_URL": "http://your-dokploy:3000/api"
      }
    }
  }
}
```

Replace `/path/to/dokploy-mcp` with the absolute path to the cloned `dokploy-mcp` directory.

## Claude Desktop Integration

Add to Claude Desktop's MCP configuration (e.g. `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dokploy": {
      "command": "node",
      "args": ["/path/to/dokploy-mcp/dist/index.js"],
      "env": {
        "DOKPLOY_API_KEY": "your-key",
        "DOKPLOY_BASE_URL": "http://your-dokploy:3000/api"
      }
    }
  }
}
```

## Docker Deployment

### Build

```bash
docker build -t dokploy-mcp .
```

### Run

```bash
docker run -e DOKPLOY_API_KEY=your-api-key -p 3001:3001 dokploy-mcp
```

For HTTP transport, set `MCP_TRANSPORT=http`:

```bash
docker run -e DOKPLOY_API_KEY=your-api-key -e MCP_TRANSPORT=http -p 3001:3001 dokploy-mcp
```

### Docker Compose

```bash
docker compose up -d
```

Set `DOKPLOY_API_KEY` (and optionally `DOKPLOY_BASE_URL`, `MCP_HTTP_AUTH_TOKEN`) in `.env` or your environment before running.

## HTTP Client Configuration

For remote MCP clients connecting over HTTP/SSE:

```json
{
  "mcpServers": {
    "dokploy": {
      "url": "http://your-dokploy-mcp-host:3001/sse",
      "headers": {
        "Authorization": "Bearer your-mcp-auth-token"
      }
    }
  }
}
```

If `MCP_HTTP_AUTH_TOKEN` is not set, omit the `Authorization` header.

## Testing

```bash
npm test
```

## Architecture

- `src/index.ts` — Entry point; selects transport based on config
- `src/server.ts` — MCP server setup and capability registration
- `src/handlers/` — Tool, resource, and prompt handlers
- `src/capabilities/` — Tool, resource, and prompt definitions
- `src/dokploy-client/` — Dokploy API client and endpoints
- `src/transports/` — STDIO and HTTP transport implementations
- `src/utils/` — Config, logging, and error mapping

See [TOOLS.md](./TOOLS.md), [RESOURCES.md](./RESOURCES.md), and [PROMPTS.md](./PROMPTS.md) for detailed capability documentation.

## License

MIT
