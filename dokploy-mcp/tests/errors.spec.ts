import { DokployApiError, mapDokployError, toMcpError } from '../src/utils/errors';

describe('DokployApiError', () => {
  it('should create error with properties', () => {
    const err = new DokployApiError('test message', 404, 'NOT_FOUND');
    expect(err.message).toBe('test message');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.name).toBe('DokployApiError');
  });

  it('should be instanceof Error', () => {
    const err = new DokployApiError('test', 500, 'INTERNAL_ERROR');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DokployApiError);
  });
});

describe('mapDokployError', () => {
  it('should pass through DokployApiError instances', async () => {
    const original = new DokployApiError('original', 401, 'UNAUTHORIZED');
    const result = await mapDokployError(original);
    expect(result).toBe(original);
    expect(result.code).toBe('UNAUTHORIZED');
  });

  it('should map 401 Response to UNAUTHORIZED', async () => {
    const response = new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    const result = await mapDokployError(response);
    expect(result.code).toBe('UNAUTHORIZED');
    expect(result.message).toContain('Invalid API key');
  });

  it('should map 403 to FORBIDDEN', async () => {
    const response = new Response('Forbidden', { status: 403 });
    const result = await mapDokployError(response);
    expect(result.code).toBe('FORBIDDEN');
    expect(result.message).toContain('Permission denied');
  });

  it('should map 404 to NOT_FOUND', async () => {
    const response = new Response('Not Found', { status: 404 });
    const result = await mapDokployError(response);
    expect(result.code).toBe('NOT_FOUND');
    expect(result.message).toContain('not found');
  });

  it('should handle Response when text() throws', async () => {
    const response = new Response('body', { status: 500, statusText: 'Internal' });
    response.text = () => Promise.reject(new Error('text failed'));
    const result = await mapDokployError(response);
    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.statusCode).toBe(500);
  });

  it('should map 400 to BAD_REQUEST', async () => {
    const response = new Response('Bad Request', { status: 400 });
    const result = await mapDokployError(response);
    expect(result.code).toBe('BAD_REQUEST');
    expect(result.message).toContain('Invalid parameters');
  });

  it('should map 500 to INTERNAL_ERROR', async () => {
    const response = new Response('Internal Server Error', { status: 500 });
    const result = await mapDokployError(response);
    expect(result.code).toBe('INTERNAL_ERROR');
  });

  it('should map network errors to NETWORK_ERROR (fetch failed)', async () => {
    const error = new TypeError('fetch failed');
    const result = await mapDokployError(error);
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.message).toContain('unreachable');
  });

  it('should map network errors to NETWORK_ERROR (network message)', async () => {
    const error = new TypeError('network request failed');
    const result = await mapDokployError(error);
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.message).toContain('unreachable');
  });

  it('should handle unknown errors', async () => {
    const error = new Error('some random error');
    const result = await mapDokployError(error);
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('some random error');
  });

  it('should handle plain string (not Error)', async () => {
    const result = await mapDokployError('something went wrong');
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('something went wrong');
  });
});

describe('toMcpError', () => {
  it('should return -32001 for UNAUTHORIZED', () => {
    const err = new DokployApiError('Unauthorized', 401, 'UNAUTHORIZED');
    const result = toMcpError(err);
    expect(result.code).toBe(-32001);
    expect(result.message).toBe('Unauthorized');
  });

  it('should return -32002 for FORBIDDEN', () => {
    const err = new DokployApiError('Forbidden', 403, 'FORBIDDEN');
    const result = toMcpError(err);
    expect(result.code).toBe(-32002);
  });

  it('should return -32602 for NOT_FOUND', () => {
    const err = new DokployApiError('Not found', 404, 'NOT_FOUND');
    const result = toMcpError(err);
    expect(result.code).toBe(-32602);
  });

  it('should return -32603 for NETWORK_ERROR', () => {
    const err = new DokployApiError('Network unreachable', 0, 'NETWORK_ERROR');
    const result = toMcpError(err);
    expect(result.code).toBe(-32603);
  });
});
