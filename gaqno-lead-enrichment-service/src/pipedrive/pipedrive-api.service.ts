import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../database/db.service";
import { pipedriveIntegrations } from "../database/schema";
import type { PipedrivePersonSearchResponse } from "../common/types";

const PIPEDRIVE_OAUTH_URL = "https://oauth.pipedrive.com/oauth/token";
const BUFFER_MINUTES = 5;

interface TokenResult {
  accessToken: string;
  apiDomain: string;
}

interface PipedriveRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  api_domain: string;
}

@Injectable()
export class PipedriveApiService {
  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
    private readonly database: DatabaseService
  ) {}

  async searchPersonByPhone(
    tenantId: string,
    phone: string
  ): Promise<PipedrivePersonSearchResponse> {
    const normalized = phone.replace(/\s+/g, "").trim();
    const endpoint = `/api/v1/persons/search?term=${encodeURIComponent(normalized)}&exact_match=true`;
    return this.authenticatedRequest<PipedrivePersonSearchResponse>(
      tenantId,
      endpoint
    );
  }

  private async getValidToken(tenantId: string): Promise<TokenResult> {
    const db = this.database.getDb();
    const rows = await db
      .select()
      .from(pipedriveIntegrations)
      .where(eq(pipedriveIntegrations.tenantId, tenantId));

    const row = rows[0];
    if (!row) {
      throw new Error(`No Pipedrive integration for tenant ${tenantId}`);
    }

    const now = new Date();
    const threshold = new Date(now.getTime() + BUFFER_MINUTES * 60 * 1000);

    if (row.expiresAt < threshold) {
      const clientId = this.config.get<string>("PIPEDRIVE_CLIENT_ID");
      const clientSecret = this.config.get<string>("PIPEDRIVE_CLIENT_SECRET");
      if (!clientId || !clientSecret) {
        throw new Error("PIPEDRIVE_CLIENT_ID and PIPEDRIVE_CLIENT_SECRET required for token refresh");
      }

      const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: row.refreshToken,
      });

      const response = await firstValueFrom(
        this.httpService.post<PipedriveRefreshResponse>(PIPEDRIVE_OAUTH_URL, body, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        })
      );

      const data = response.data;
      const newExpiresAt = new Date(
        now.getTime() + data.expires_in * 1000
      );

      await db
        .update(pipedriveIntegrations)
        .set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: newExpiresAt,
          apiDomain: data.api_domain,
        })
        .where(eq(pipedriveIntegrations.tenantId, tenantId));

      return {
        accessToken: data.access_token,
        apiDomain: data.api_domain,
      };
    }

    return {
      accessToken: row.accessToken,
      apiDomain: row.apiDomain,
    };
  }

  private async authenticatedRequest<T>(
    tenantId: string,
    endpoint: string
  ): Promise<T> {
    const { accessToken, apiDomain } = await this.getValidToken(tenantId);
    const baseUrl = `https://${apiDomain}`.replace(/\/$/, "");
    const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const response = await firstValueFrom(
      this.httpService.get<T>(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    );

    return response.data;
  }
}
