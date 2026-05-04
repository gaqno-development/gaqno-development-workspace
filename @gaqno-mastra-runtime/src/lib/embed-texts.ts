const EMBEDDING_MODEL = 'text-embedding-3-small' as const;
const EMBEDDING_BATCH_SIZE = 100 as const;

interface EmbeddingRow {
  readonly embedding: readonly number[];
}

function parseEmbeddingResponse(json: unknown): number[][] {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid embeddings response shape');
  }
  const data = (json as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    throw new Error('Invalid embeddings response: data');
  }
  return data.map((row, index) => {
    if (!row || typeof row !== 'object' || !('embedding' in row)) {
      throw new Error(`Invalid embedding row at index ${index}`);
    }
    const embedding = (row as EmbeddingRow).embedding;
    if (!Array.isArray(embedding) || !embedding.every((v) => typeof v === 'number')) {
      throw new Error(`Invalid embedding vector at index ${index}`);
    }
    return [...embedding];
  });
}

async function embedBatch(openaiApiKey: string, inputs: readonly string[]): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: [...inputs] }),
  });
  const json: unknown = await response.json();
  if (!response.ok) {
    const detail = json && typeof json === 'object' && 'error' in json ? JSON.stringify(json) : response.statusText;
    throw new Error(`OpenAI embeddings failed: ${detail}`);
  }
  return parseEmbeddingResponse(json);
}

export async function embedTexts(
  openaiApiKey: string,
  values: readonly string[],
): Promise<number[][]> {
  const result: number[][] = [];
  for (let offset = 0; offset < values.length; offset += EMBEDDING_BATCH_SIZE) {
    const slice = values.slice(offset, offset + EMBEDDING_BATCH_SIZE);
    const batch = await embedBatch(openaiApiKey, slice);
    result.push(...batch);
  }
  return result;
}
