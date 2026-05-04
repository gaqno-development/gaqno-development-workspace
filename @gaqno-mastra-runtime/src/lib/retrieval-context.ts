export type RetrievalRow = {
  readonly metadata?: Record<string, unknown>;
};

export function formatRetrievalContext(rows: readonly RetrievalRow[]): string {
  const parts = rows
    .map((row) => row.metadata?.text)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  return parts.join('\n\n---\n\n');
}
