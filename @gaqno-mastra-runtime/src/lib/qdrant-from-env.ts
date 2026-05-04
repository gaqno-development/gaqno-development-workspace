import { QdrantVector } from '@mastra/qdrant';

export function readQdrantUrl(): string {
  const url = process.env.QDRANT_URL?.trim();
  if (!url) {
    throw new Error('Missing QDRANT_URL for Qdrant Cloud (or self-hosted) RAG store');
  }
  return url;
}

export function createQdrantVectorStore(): QdrantVector {
  const apiKey = process.env.QDRANT_API_KEY?.trim();
  return new QdrantVector({
    id: 'gaqno-qdrant-rag',
    url: readQdrantUrl(),
    apiKey: apiKey && apiKey.length > 0 ? apiKey : undefined,
  });
}
