import { basename } from 'node:path';
import {
  CODEBASE_QDRANT_INDEX,
  RAG_EMBEDDING_DIMENSION,
  createQdrantVectorStore,
  ensureQdrantIndex,
  readChunkTextsFromPath,
  upsertChunkVectors,
} from '@gaqno-development/mastra-runtime';

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

async function main(): Promise<void> {
  const filePath = process.argv[2] ?? process.env.CODEBASE_INGEST_FILE?.trim();
  if (!filePath) {
    throw new Error('Usage: npm run ingest:codebase -- <path-to-text-file> [docId]');
  }
  const docId = readDocId(filePath, process.argv[3]);
  const texts = await readChunkTextsFromPath(filePath, docId);
  if (texts.length === 0) {
    throw new Error('No chunks produced from input file');
  }
  const store = createQdrantVectorStore();
  await ensureQdrantIndex(store, CODEBASE_QDRANT_INDEX, RAG_EMBEDDING_DIMENSION);
  await upsertChunkVectors(store, CODEBASE_QDRANT_INDEX, docId, texts, readOpenAiKey(), (text) => ({
    text,
    docId,
    path: filePath,
  }));
  console.log(`Ingested ${texts.length} vectors for docId=${docId} into ${CODEBASE_QDRANT_INDEX}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
