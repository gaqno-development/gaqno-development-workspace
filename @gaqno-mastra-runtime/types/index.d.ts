import type { Agent, ToolsInput } from '@mastra/core/agent';
import type { Mastra } from '@mastra/core/mastra';
import type { ApiRoute } from '@mastra/core/server';
import type { MastraStorage } from '@mastra/core/storage';
import type { IMastraLogger } from '@mastra/core/logger';

export interface CreateMastraInstanceOptions {
  readonly studio?: boolean;
  readonly storage?: MastraStorage;
  readonly logger?: IMastraLogger;
  readonly observability?: unknown;
  readonly studioChatRoute?: ApiRoute;
}

export declare function createMastraInstance(
  options?: CreateMastraInstanceOptions,
): Promise<Mastra>;

export declare const engineeringAgent: Agent;
export declare const wppClientAgent: Agent;
export declare const portalAgent: Agent;

export declare const codebaseSearchTool: ToolsInput[string];
export declare const knowledgeSearchTool: ToolsInput[string];
export declare const tenantTopicsSearchTool: ToolsInput[string];
export declare const portalServiceFetchTool: ToolsInput[string];

export declare function collectionNameForTenant(tenantId: string): string;

export interface EmbedTextsOptions {
  readonly model?: string;
  readonly batchSize?: number;
}
export declare function embedTexts(
  texts: readonly string[],
  options?: EmbedTextsOptions,
): Promise<number[][]>;

export interface QdrantVectorStoreLike {
  upsert(args: {
    indexName: string;
    vectors: number[][];
    metadata?: ReadonlyArray<Record<string, unknown>>;
    ids?: readonly string[];
  }): Promise<unknown>;
  query(args: {
    indexName: string;
    queryVector: number[];
    topK?: number;
    filter?: Record<string, unknown>;
  }): Promise<ReadonlyArray<{ readonly metadata?: { readonly text?: string } }>>;
}
export declare function createQdrantVectorStore(): QdrantVectorStoreLike;

export declare function ensureQdrantIndex(
  store: QdrantVectorStoreLike,
  indexName: string,
  dimension: number,
): Promise<void>;

export declare function readChunkTextsFromPath(path: string): Promise<readonly string[]>;

export interface UpsertChunkVectorsArgs {
  readonly store: QdrantVectorStoreLike;
  readonly indexName: string;
  readonly chunks: readonly string[];
  readonly metadata?: ReadonlyArray<Record<string, unknown>>;
  readonly batchSize?: number;
}
export declare function upsertChunkVectors(args: UpsertChunkVectorsArgs): Promise<void>;

export interface RetrievalMatch {
  readonly metadata?: { readonly text?: string };
}
export declare function formatRetrievalContext(
  matches: ReadonlyArray<RetrievalMatch>,
): string;

export type PortalServiceKey = 'erp' | 'crm' | 'omnichannel' | 'shop';
export declare const PORTAL_SERVICE_KEYS: readonly PortalServiceKey[];
export declare const PORTAL_SERVICE_ENV_KEYS: Readonly<Record<PortalServiceKey, string>>;
export declare const PORTAL_SERVICE_PATH_PREFIXES: Readonly<Record<PortalServiceKey, readonly string[]>>;
export declare function readPortalServiceBaseUrl(key: PortalServiceKey): string;
export declare function assertValidPortalResourcePath(path: string): void;
export declare function assertPathMatchesServiceAllowlist(
  key: PortalServiceKey,
  path: string,
): void;

export declare const RAG_QDRANT_INDEX: string;
export declare const RAG_DEFAULT_TOP_K: number;
export declare const RAG_EMBEDDING_DIMENSION: number;
export declare const RAG_CHUNK_MAX_SIZE: number;
export declare const RAG_CHUNK_OVERLAP: number;
export declare const CODEBASE_QDRANT_INDEX: string;
export declare const TENANT_TOPICS_PREFIX: string;
export declare const MAX_QDRANT_COLLECTION_NAME_LENGTH: number;
export declare const MAX_TENANT_ID_LENGTH: number;

export interface MastraServerOptionsArgs {
  readonly studioChatRoute?: ApiRoute;
}
export interface MastraServerOptions {
  readonly middleware?: ReadonlyArray<unknown>;
  readonly apiRoutes?: ReadonlyArray<ApiRoute>;
}
export declare function buildMastraServerOptions(
  args?: MastraServerOptionsArgs,
): MastraServerOptions;

export declare function injectTenantIdFromHeader(): unknown;
export declare function injectPortalAuthToken(): unknown;
export declare function redirectMisplacedStudioPath(): unknown;
export declare function resolveStudioPrefixRedirect(path: string): string | null;
