export interface CreateMastraInstanceOptions {
  readonly studio?: boolean;
  readonly storage?: unknown;
  readonly logger?: unknown;
  readonly observability?: unknown;
  readonly studioChatRoute?: unknown;
}

export declare function createMastraInstance(options?: CreateMastraInstanceOptions): Promise<unknown>;

export declare const engineeringAgent: unknown;
export declare const wppClientAgent: unknown;
export declare const portalAgent: unknown;

export declare const codebaseSearchTool: unknown;
export declare const knowledgeSearchTool: unknown;
export declare const tenantTopicsSearchTool: unknown;
export declare const portalServiceFetchTool: unknown;

export declare function collectionNameForTenant(tenantId: string): string;
export declare function embedTexts(texts: readonly string[]): Promise<number[][]>;
export declare function ensureQdrantIndex(store: unknown, indexName: string, dimension: number): Promise<void>;
export declare function readChunkTextsFromPath(path: string): Promise<readonly string[]>;
export declare function upsertChunkVectors(args: unknown): Promise<void>;
export declare function createQdrantVectorStore(): unknown;
export declare function formatRetrievalContext(matches: ReadonlyArray<{ readonly metadata?: { readonly text?: string } }>): string;

export type PortalServiceKey = 'erp' | 'crm' | 'omnichannel' | 'shop';
export declare const PORTAL_SERVICE_KEYS: readonly PortalServiceKey[];
export declare const PORTAL_SERVICE_ENV_KEYS: Readonly<Record<PortalServiceKey, string>>;
export declare const PORTAL_SERVICE_PATH_PREFIXES: Readonly<Record<PortalServiceKey, readonly string[]>>;
export declare function readPortalServiceBaseUrl(key: PortalServiceKey): string;
export declare function assertValidPortalResourcePath(path: string): void;
export declare function assertPathMatchesServiceAllowlist(key: PortalServiceKey, path: string): void;

export declare const RAG_QDRANT_INDEX: string;
export declare const RAG_DEFAULT_TOP_K: number;
export declare const RAG_EMBEDDING_DIMENSION: number;
export declare const RAG_CHUNK_MAX_SIZE: number;
export declare const RAG_CHUNK_OVERLAP: number;
export declare const CODEBASE_QDRANT_INDEX: string;
export declare const TENANT_TOPICS_PREFIX: string;
export declare const MAX_QDRANT_COLLECTION_NAME_LENGTH: number;
export declare const MAX_TENANT_ID_LENGTH: number;

export declare function injectTenantIdFromHeader(): unknown;
export declare function injectPortalAuthToken(): unknown;
export declare function redirectMisplacedStudioPath(): unknown;
export declare function buildMastraServerOptions(args?: { readonly studioChatRoute?: unknown }): unknown;
export declare function resolveStudioPrefixRedirect(path: string): string | null;
