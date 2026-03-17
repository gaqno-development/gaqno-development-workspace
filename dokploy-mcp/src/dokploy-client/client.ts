import { mapDokployError } from '../utils/errors.js';

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string>;
}

export class DokployClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: { apiKey: string; baseUrl: string }) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
  }

  async request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const method = options?.method ?? 'GET';
    const url = new URL(this.baseUrl + endpoint);
    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        url.searchParams.set(k, v);
      }
    }
    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      accept: 'application/json',
    };
    if (options?.body !== undefined) {
      headers['content-type'] = 'application/json';
    }
    const init: RequestInit = {
      method,
      headers,
    };
    if (options?.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }
    const response = await fetch(url.toString(), init);
    if (!response.ok) {
      throw mapDokployError(response);
    }
    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
}
