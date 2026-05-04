import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  RAG_DEFAULT_TOP_K,
  RAG_EMBEDDING_DIMENSION,
  RAG_QDRANT_INDEX,
} from '../constants/rag.js';
import { embedTexts } from '../lib/embed-texts.js';
import { createQdrantVectorStore } from '../lib/qdrant-from-env.js';
import { formatRetrievalContext } from '../lib/retrieval-context.js';

function readOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error('Missing OPENAI_API_KEY for embeddings');
  }
  return key;
}

export const knowledgeSearchTool = createTool({
  id: 'search-knowledge-base',
  description:
    'Retrieve relevant text chunks from the gaqno knowledge base (Qdrant). Use before answering factual questions about internal documentation.',
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
  execute: async (input) => {
    const topK = input.topK ?? RAG_DEFAULT_TOP_K;
    const store = createQdrantVectorStore();
    const vectors = await embedTexts(readOpenAiKey(), [input.query]);
    const queryVector = vectors[0];
    if (!queryVector || queryVector.length !== RAG_EMBEDDING_DIMENSION) {
      throw new Error('Embedding dimension mismatch');
    }
    const rows = await store.query({
      indexName: RAG_QDRANT_INDEX,
      queryVector,
      topK,
    });
    const context = formatRetrievalContext(rows);
    return { context, hitCount: rows.length };
  },
});
