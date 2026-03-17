import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('stdio');

export async function startStdioTransport(server: McpServer): Promise<void> {
  logger.info('Starting STDIO transport');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('STDIO transport connected');
}
