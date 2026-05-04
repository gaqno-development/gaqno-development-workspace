import { readFile } from 'node:fs/promises';
import type { QdrantVector } from '@mastra/qdrant';
import { MDocument } from '@mastra/rag';
import { RAG_CHUNK_MAX_SIZE, RAG_CHUNK_OVERLAP } from '../constants/rag';
import { embedTexts } from './embed-texts';

export async function readChunkTextsFromPath(filePath: string, docId: string): Promise<string[]> {
  const raw = await readFile(filePath, 'utf8');
  const doc = MDocument.fromText(raw, { docId, source: filePath });
  const chunks = await doc.chunk({
    strategy: 'recursive',
    maxSize: RAG_CHUNK_MAX_SIZE,
    overlap: RAG_CHUNK_OVERLAP,
  });
  return chunks.map((chunk) => chunk.text);
}

export async function upsertChunkVectors(
  store: QdrantVector,
  indexName: string,
  docId: string,
  texts: readonly string[],
  openaiKey: string,
  buildRowMeta: (text: string) => Record<string, unknown>,
): Promise<void> {
  const embeddings = await embedTexts(openaiKey, [...texts]);
  const ids = texts.map((_, index) => `${docId}#${index}`);
  const metadata = texts.map((text) => buildRowMeta(text));
  await store.upsert({
    indexName,
    vectors: embeddings,
    metadata,
    ids,
  });
}
