import { DokployClient } from '../src/dokploy-client/client';

describe('DokployClient', () => {
  const client = new DokployClient({
    apiKey: 'test-key',
    baseUrl: 'http://localhost:3000/api',
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should make GET request with correct headers', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ projectId: 'p1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    const result = await client.request<{ projectId: string }>('/project.one', {
      query: { projectId: 'p1' },
    });
    expect(result).toEqual({ projectId: 'p1' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/project.one'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'x-api-key': 'test-key' }),
      })
    );
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain(
      'projectId=p1'
    );
  });

  it('should make POST request with body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
    await client.request('/project.create', {
      method: 'POST',
      body: { name: 'test' },
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
      })
    );
  });

  it('should return empty object for empty response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 200 })
    );
    const result = await client.request('/test');
    expect(result).toEqual({});
  });

  it('should return text for non-JSON response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('plain text', { status: 200 })
    );
    const result = await client.request('/test');
    expect(result).toBe('plain text');
  });

  it('should throw DokployApiError on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      })
    );
    await expect(client.request('/test')).rejects.toThrow();
  });

  it('should throw DokployApiError on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    await expect(client.request('/test')).rejects.toThrow();
  });

  it('should strip trailing slash from baseUrl', async () => {
    const clientWithSlash = new DokployClient({
      apiKey: 'key',
      baseUrl: 'http://localhost:3000/api/',
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 })
    );
    await clientWithSlash.request('/projects');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/projects',
      expect.any(Object)
    );
  });
});
