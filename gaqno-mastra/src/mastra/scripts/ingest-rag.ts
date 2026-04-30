import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { QdrantVector } from '@mastra/qdrant';
import { MDocument } from '@mastra/rag';
import {
  RAG_CHUNK_MAX_SIZE,
  RAG_CHUNK_OVERLAP,
  RAG_EMBEDDING_DIMENSION,
  RAG_QDRANT_INDEX,
} from '../constants/rag';
import { embedTexts } from '../lib/embed-texts';
import { createQdrantVectorStore } from '../lib/qdrant-from-env';

function readOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  return key;
}

function readDocId(filePath: string, explicit?: string): string {
  const trimmed = explicit?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : basename(filePath);
}

async function ensureIndex(store: QdrantVector): Promise<void> {
  const names = await store.listIndexes();
  if (names.includes(RAG_QDRANT_INDEX)) {
    return;
  }
  await store.createIndex({
    indexName: RAG_QDRANT_INDEX,
    dimension: RAG_EMBEDDING_DIMENSION,
    metric: 'cosine',
  });
}

async function main(): Promise<void> {
  const filePath = process.argv[2] ?? process.env.RAG_INGEST_FILE?.trim();
  if (!filePath) {
    throw new Error('Usage: npm run ingest:rag -- <path-to-text-file> [docId]');
  }
  const docId = readDocId(filePath, process.argv[3]);
  const raw = await readFile(filePath, 'utf8');
  const doc = MDocument.fromText(raw, { docId, source: filePath });
  const chunks = await doc.chunk({
    strategy: 'recursive',
    maxSize: RAG_CHUNK_MAX_SIZE,
    overlap: RAG_CHUNK_OVERLAP,
  });
  const texts = chunks.map((chunk) => chunk.text);
  if (texts.length === 0) {
    throw new Error('No chunks produced from input file');
  }
  const store = createQdrantVectorStore();
  await ensureIndex(store);
  const openaiKey = readOpenAiKey();
  const embeddings = await embedTexts(openaiKey, texts);
  const ids = texts.map((_, index) => `${docId}#${index}`);
  const metadata = texts.map((text) => ({ text, docId }));
  await store.upsert({
    indexName: RAG_QDRANT_INDEX,
    vectors: embeddings,
    metadata,
    ids,
  });
  console.log(`Ingested ${texts.length} vectors for docId=${docId} into ${RAG_QDRANT_INDEX}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
