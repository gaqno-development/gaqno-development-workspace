export const CODEBASE_QDRANT_INDEX = 'gaqno_codebase_kb' as const;

export const TENANT_TOPICS_PREFIX = 'topics_' as const;

export const MAX_QDRANT_COLLECTION_NAME_LENGTH = 255 as const;

export const MAX_TENANT_ID_LENGTH =
  MAX_QDRANT_COLLECTION_NAME_LENGTH - TENANT_TOPICS_PREFIX.length;
