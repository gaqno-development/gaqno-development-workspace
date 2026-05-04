import { basename } from 'node:path';
import {
  RAG_EMBEDDING_DIMENSION,
  collectionNameForTenant,
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

function parseArgs(argv: readonly string[]): { tenantId: string; filePath: string; docId?: string } {
  let tenantId = '';
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]!;
    if (token === '--tenant') {
      tenantId = argv[i + 1]?.trim() ?? '';
      i += 1;
      continue;
    }
    if (token === '--') {
      continue;
    }
    positional.push(token);
  }
  const filePath = positional[0]?.trim() ?? '';
  const docId = positional[1]?.trim();
  return { tenantId, filePath, docId: docId && docId.length > 0 ? docId : undefined };
}

async function runTenantIngest(args: {
  tenantId: string;
  filePath: string;
  docId?: string;
}): Promise<void> {
  const indexName = collectionNameForTenant(args.tenantId);
  const docId = readDocId(args.filePath, args.docId);
  const texts = await readChunkTextsFromPath(args.filePath, docId);
  if (texts.length === 0) {
    throw new Error('No chunks produced from input file');
  }
  const store = createQdrantVectorStore();
  await ensureQdrantIndex(store, indexName, RAG_EMBEDDING_DIMENSION);
  const tenantKey = args.tenantId.trim();
  await upsertChunkVectors(store, indexName, docId, texts, readOpenAiKey(), (text) => ({
    text,
    docId,
    tenantId: tenantKey,
    path: args.filePath,
  }));
  console.log(`Ingested ${texts.length} vectors for docId=${docId} into ${indexName}`);
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  const filePath =
    parsed.filePath.length > 0 ? parsed.filePath : process.env.TENANT_TOPICS_INGEST_FILE?.trim() ?? '';
  if (!parsed.tenantId || !filePath) {
    throw new Error('Usage: npm run ingest:tenant-topics -- --tenant <tenantId> <path-to-text-file> [docId]');
  }
  await runTenantIngest({ tenantId: parsed.tenantId, filePath, docId: parsed.docId });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
