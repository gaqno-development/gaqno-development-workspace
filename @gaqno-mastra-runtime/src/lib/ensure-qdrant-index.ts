import type { QdrantVector } from '@mastra/qdrant';

export async function ensureQdrantIndex(
  store: QdrantVector,
  indexName: string,
  dimension: number,
): Promise<void> {
  const names = await store.listIndexes();
  if (names.includes(indexName)) {
    return;
  }
  await store.createIndex({
    indexName,
    dimension,
    metric: 'cosine',
  });
}
