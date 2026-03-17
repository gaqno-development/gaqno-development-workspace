import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DokployClient } from './dokploy-client/client.js';
import { TOOLS } from './capabilities/tools.js';
import { FIXED_RESOURCES, RESOURCE_TEMPLATES } from './capabilities/resources.js';
import { PROMPTS } from './capabilities/prompts.js';
import { handleToolCall } from './handlers/tool-handler.js';
import { handleResourceRead } from './handlers/resource-handler.js';
import { handlePromptGet } from './handlers/prompt-handler.js';
import type { Config } from './utils/config.js';

function buildPromptArgsSchema(
  args: Array<{ name: string; description: string; required: boolean }>
): Record<string, z.ZodTypeAny> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const arg of args) {
    shape[arg.name] = arg.required ? z.string() : z.string().optional();
  }
  return shape;
}

export function createServer(config: Config): McpServer {
  const client = new DokployClient({
    apiKey: config.dokployApiKey,
    baseUrl: config.dokployBaseUrl,
  });

  const server = new McpServer({
    name: 'dokploy-mcp',
    version: '1.0.0',
  });

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => {
        try {
          const result = await handleToolCall(client, tool.name, (args ?? {}) as Record<string, unknown>);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return {
            content: [{ type: 'text', text: `Error: ${message}` }],
            isError: true,
          };
        }
      }
    );
  }

  for (const res of FIXED_RESOURCES) {
    server.resource(res.name, res.uri, async (uri) => {
      const text = await handleResourceRead(client, uri.href);
      return {
        contents: [{ uri: uri.href, mimeType: res.mimeType, text }],
      };
    });
  }

  for (const tmpl of RESOURCE_TEMPLATES) {
    server.resource(
      tmpl.name,
      new ResourceTemplate(tmpl.uriTemplate, { list: undefined }),
      async (uri) => {
        const text = await handleResourceRead(client, uri.href);
        return {
          contents: [{ uri: uri.href, mimeType: tmpl.mimeType, text }],
        };
      }
    );
  }

  for (const prompt of PROMPTS) {
    const argsSchema = buildPromptArgsSchema(prompt.arguments);
    server.registerPrompt(
      prompt.name,
      {
        description: prompt.description,
        argsSchema,
      },
      async (args) => {
        const stringArgs: Record<string, string> = {};
        for (const [k, v] of Object.entries(args ?? {})) {
          stringArgs[k] = v != null ? String(v) : '';
        }
        const messages = handlePromptGet(prompt.name, stringArgs);
        return { messages };
      }
    );
  }

  return server;
}
