import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createLogger } from '../utils/logger.js';
import type { Config } from '../utils/config.js';

const logger = createLogger('http');

const sessions = new Map<
  string,
  { transport: SSEServerTransport; server: McpServer }
>();

export async function startHttpTransport(
  createServerFn: () => McpServer,
  config: Config
): Promise<void> {
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: 'dokploy-mcp', transport: 'http' });
  });

  const authMiddleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    if (!config.mcpHttpAuthToken) {
      next();
      return;
    }
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${config.mcpHttpAuthToken}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };

  app.use(express.json());

  app.get('/sse', authMiddleware, async (req, res) => {
    const server = createServerFn();
    const transport = new SSEServerTransport('/messages', res);
    const sessionId = transport.sessionId;
    sessions.set(sessionId, { transport, server });
    transport.onclose = () => {
      sessions.delete(sessionId);
      logger.info('SSE client disconnected', { sessionId });
    };
    await server.connect(transport);
    logger.info('SSE client connected', { sessionId });
  });

  app.post('/messages', authMiddleware, async (req, res) => {
    const sessionId = req.query.sessionId as string | undefined;
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId query parameter required' });
      return;
    }
    const entry = sessions.get(sessionId);
    if (!entry) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    await entry.transport.handlePostMessage(req, res, req.body);
  });

  const port = config.mcpHttpPort;
  app.listen(port, () => {
    logger.info(`HTTP transport listening on port ${port}`);
  });
}
