import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { RAG_DEFAULT_TOP_K, RAG_EMBEDDING_DIMENSION } from '../constants/rag.js';
import { embedTexts } from '../lib/embed-texts.js';
import { collectionNameForTenant } from '../lib/collection-name-for-tenant.js';
import { createQdrantVectorStore } from '../lib/qdrant-from-env.js';
import { formatRetrievalContext } from '../lib/retrieval-context.js';

function readOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error('Missing OPENAI_API_KEY for embeddings');
  }
  return key;
}

export const tenantTopicsSearchTool = createTool({
  id: 'search-tenant-topics',
  description:
    'Retrieve relevant chunks from the current tenant topic index in Qdrant. Requires tenantId in request context.',
  inputSchema: z.object({
    query: z.string().min(1).describe('Search query in natural language'),
    topK: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .describe('Number of chunks to retrieve'),
  }),
  outputSchema: z.object({
    context: z.string(),
    hitCount: z.number().int().nonnegative(),
  }),
  requestContextSchema: z.object({
    tenantId: z.string().min(1),
  }),
  execute: async (input, context) => {
    const tenantIdValue = context.requestContext?.get('tenantId');
    if (typeof tenantIdValue !== 'string' || tenantIdValue.trim().length === 0) {
      throw new Error(
        'Missing tenantId in request context. Send header x-tenant-id from a trusted gateway or requestContext.tenantId in the JSON body.',
      );
    }
    const tenantId = tenantIdValue.trim();
    const indexName = collectionNameForTenant(tenantId);
    const topK = input.topK ?? RAG_DEFAULT_TOP_K;
    const store = createQdrantVectorStore();
    const vectors = await embedTexts(readOpenAiKey(), [input.query]);
    const queryVector = vectors[0];
    if (!queryVector || queryVector.length !== RAG_EMBEDDING_DIMENSION) {
      throw new Error('Embedding dimension mismatch');
    }
    const rows = await store.query({
      indexName,
      queryVector,
      topK,
    });
    const ctx = formatRetrievalContext(rows);
    return { context: ctx, hitCount: rows.length };
  },
});
