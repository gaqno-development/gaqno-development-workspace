import { describe, expect, it } from 'vitest';
import { formatRetrievalContext } from './retrieval-context';

describe('formatRetrievalContext', () => {
  it('should join text fields from metadata', () => {
    expect(
      formatRetrievalContext([{ metadata: { text: 'alpha' } }, { metadata: { text: 'beta' } }]),
    ).toBe('alpha\n\n---\n\nbeta');
  });

  it('should skip rows without text metadata', () => {
    expect(formatRetrievalContext([{ metadata: {} }, { metadata: { text: 'only' } }])).toBe('only');
  });

  it('should return empty string when no usable rows', () => {
    expect(formatRetrievalContext([])).toBe('');
  });
});
