#!/usr/bin/env node
import { getConfig } from './utils/config.js';
import { createLogger } from './utils/logger.js';
import { createServer } from './server.js';
import { startStdioTransport } from './transports/stdio.js';
import { startHttpTransport } from './transports/http.js';

const logger = createLogger('main');

async function main(): Promise<void> {
  const config = getConfig();
  logger.info('Starting Dokploy MCP server', { transport: config.mcpTransport });

  if (config.mcpTransport === 'http' || config.mcpTransport === 'both') {
    const createServerFn = () => createServer(config);
    await startHttpTransport(createServerFn, config);
  }

  if (config.mcpTransport === 'stdio' || config.mcpTransport === 'both') {
    const stdioServer = createServer(config);
    await startStdioTransport(stdioServer);
  }
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});
