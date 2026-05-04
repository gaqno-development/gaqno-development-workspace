import { Mastra } from '@mastra/core/mastra';
import { MastraCompositeStore } from '@mastra/core/storage';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import type { ApiRoute } from '@mastra/core/server';
import { engineeringAgent } from './agents/engineering-agent';
import { wppClientAgent } from './agents/wpp-client-agent';
import { portalAgent } from './agents/portal-agent';
import { buildMastraServerOptions } from './config/server-options';

export interface CreateMastraInstanceOptions {
  readonly studio?: boolean;
  readonly storage?: unknown;
  readonly logger?: unknown;
  readonly observability?: unknown;
  readonly studioChatRoute?: ApiRoute;
}

function defaultLibSqlStorage(): MastraCompositeStore {
  return new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({ id: 'mastra-storage', url: 'file:./mastra.db' }),
  });
}

async function buildStudioStorage(): Promise<MastraCompositeStore> {
  const { DuckDBStore } = await import('@mastra/duckdb');
  const observabilityStore = await new DuckDBStore().getStore('observability');
  return new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({ id: 'mastra-storage', url: 'file:./mastra.db' }),
    domains: { observability: observabilityStore },
  });
}

async function buildStudioObservability(): Promise<unknown> {
  const { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } =
    await import('@mastra/observability');
  return new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [new DefaultExporter(), new CloudExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  });
}

async function defaultStudioChatRoute(): Promise<ApiRoute> {
  const { chatRoute } = await import('@mastra/ai-sdk');
  return chatRoute({ path: '/chat/:agentId' });
}

export async function createMastraInstance(options: CreateMastraInstanceOptions = {}) {
  const studio = options.studio === true;
  const storage = (options.storage ??
    (studio ? await buildStudioStorage() : defaultLibSqlStorage())) as never;
  const logger = (options.logger ?? new PinoLogger({ name: 'Mastra', level: 'info' })) as never;
  const observability = (options.observability ?? (studio ? await buildStudioObservability() : undefined)) as never;
  const studioChatRoute =
    options.studioChatRoute ?? (studio ? await defaultStudioChatRoute() : undefined);
  const server = buildMastraServerOptions({ studioChatRoute });
  return new Mastra({
    agents: { engineeringAgent, wppClientAgent, portalAgent },
    server,
    storage,
    logger,
    ...(observability ? { observability } : {}),
  } as never);
}
