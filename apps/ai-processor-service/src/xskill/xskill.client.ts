import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';

const MAX_POLL_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 60000;

export interface XSkillCreateTaskRequest {
  prompt: string;
  model?: string;
  options?: Record<string, unknown>;
}

export interface XSkillCreateTaskResponse {
  taskId: string;
  status: string;
  [key: string]: unknown;
}

export interface XSkillQueryTaskResponse {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string | Record<string, unknown>;
  mediaUrls?: string[];
  error?: string;
  code?: string;
  [key: string]: unknown;
}

@Injectable()
export class XSkillClient {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private failureCount = 0;
  private circuitOpenUntil = 0;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('XSKILL_BASE_URL') ?? 'https://api.xskill.ai';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.get<string>('XSKILL_API_KEY') ?? ''}`,
      },
    });
  }

  async createTask(
    request: XSkillCreateTaskRequest,
  ): Promise<XSkillCreateTaskResponse> {
    this.ensureCircuitClosed();
    let lastError: Error | null = null;
    let backoff = INITIAL_BACKOFF_MS;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const response = await this.client.post<XSkillCreateTaskResponse>(
          '/api/v3/tasks/create',
          request,
        );
        this.onSuccess();
        return response.data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.onFailure();
        if (attempt < 4) {
          await this.sleep(backoff);
          backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
        }
      }
    }
    throw lastError ?? new Error('XSkill create failed');
  }

  async queryTask(taskId: string): Promise<XSkillQueryTaskResponse> {
    this.ensureCircuitClosed();
    let lastError: Error | null = null;
    let backoff = INITIAL_BACKOFF_MS;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const response = await this.client.post<XSkillQueryTaskResponse>(
          '/api/v3/tasks/query',
          { taskId },
        );
        this.onSuccess();
        return response.data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.onFailure();
        if (attempt < 4) {
          await this.sleep(backoff);
          backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
        }
      }
    }
    throw lastError ?? new Error('XSkill query failed');
  }

  async pollUntilDone(
    externalTaskId: string,
    startTime: number = Date.now(),
  ): Promise<XSkillQueryTaskResponse> {
    while (Date.now() - startTime < MAX_POLL_MS) {
      const result = await this.queryTask(externalTaskId);
      if (
        result.status === 'completed' ||
        result.status === 'failed'
      ) {
        return result;
      }
      await this.sleep(POLL_INTERVAL_MS);
    }
    throw new Error('XSkill task timed out after 5 minutes');
  }

  private ensureCircuitClosed(): void {
    if (this.circuitOpenUntil > 0 && Date.now() >= this.circuitOpenUntil) {
      this.circuitOpenUntil = 0;
      this.failureCount = 0;
    }
    if (this.circuitOpenUntil > 0) {
      throw new Error('Circuit breaker open');
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
  }

  private onFailure(): void {
    this.failureCount += 1;
    if (this.failureCount >= CIRCUIT_FAILURE_THRESHOLD) {
      this.circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
