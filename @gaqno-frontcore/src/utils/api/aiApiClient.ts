import type { AxiosInstance } from "axios";
import { coreAxiosClient } from "./api-client";
import type {
  CampaignRecord,
  AttributionReport,
} from "@gaqno-development/types/attribution";
import type { BillingSummary } from "@gaqno-development/types/billing";
import type { VideoTemplateSummary } from "@gaqno-development/types/video-template";
import type { VideoGenerationResponse } from "@gaqno-development/types/video";

export interface ProductProfileRequestProduct {
  id: string;
  name: string;
  price: number;
  tenantId: string;
  description?: string;
  sku?: string;
  stock?: number;
  category?: string;
  imageUrls?: string[];
}

export interface BuildProductProfileRequest {
  product: ProductProfileRequestProduct;
  inferMissing?: boolean;
}

export interface SemanticFieldValue {
  value: string | string[] | number | null;
  confidence: number;
  source: "provided" | "inferred";
}

export interface ProductProfileResponse {
  productId: string;
  tenantId: string;
  profile: Record<string, SemanticFieldValue>;
  overallConfidence: number;
}

export interface GenerateContentProductInput {
  id: string;
  name: string;
  price: number;
  tenantId: string;
  description?: string;
  category?: string;
  imageUrls?: string[];
}

export interface GenerateContentRequest {
  product: GenerateContentProductInput;
}

export interface GenerateContentResponse {
  copy: string;
  assumptions: string[];
}

export interface PublishDistributionBody {
  to: string;
  channelType: "whatsapp";
  content: { text: string; mediaUrl?: string };
}

export interface CreateCampaignBody {
  tenantId?: string;
  name: string;
  startAt: string;
  endAt: string;
}

export interface GenerateVideoFromTemplateBody {
  templateId: string;
  product?: { name?: string; description?: string };
  model?: string;
}

export interface ErpProduct {
  id: string;
  name: string;
  price: number;
  tenantId: string;
  description?: string;
  sku?: string;
  stock?: number;
  category?: string;
  imageUrls?: string[];
}

export interface ErpProductsQuery {
  tenantId?: string;
  limit?: number;
  offset?: number;
}

export interface TaskStatusResponse {
  taskId: string;
  status: string;
  model?: string;
  result?: unknown;
  price?: number;
  error?: string;
}

export interface ImageGenerationTaskResponse {
  taskId: string;
  status: string;
  model: string;
  price?: number;
}

export type { CampaignRecord, AttributionReport, BillingSummary };
export type { VideoTemplateSummary, VideoGenerationResponse };

const defaultClient = coreAxiosClient.ai;

export function createAiApiClient(client: AxiosInstance = defaultClient) {
  return {
    async buildProductProfile(
      request: BuildProductProfileRequest
    ): Promise<ProductProfileResponse> {
      const { data } = await client.post<ProductProfileResponse>(
        "product-profile/build",
        request
      );
      return data;
    },

    async generateProductContent(
      request: GenerateContentRequest
    ): Promise<GenerateContentResponse> {
      const { data } = await client.post<GenerateContentResponse>(
        "product-content/generate",
        request
      );
      return data;
    },

    async getVideoModels(): Promise<unknown[]> {
      const { data } = await client.get<{ data?: unknown[] }>(
        "v1/videos/models"
      );
      return data?.data ?? [];
    },

    async getVideoTemplates(): Promise<VideoTemplateSummary[]> {
      const { data } = await client.get<VideoTemplateSummary[]>(
        "v1/videos/templates"
      );
      return data ?? [];
    },

    async generateVideoFromTemplate(
      body: GenerateVideoFromTemplateBody
    ): Promise<VideoGenerationResponse> {
      const { data } = await client.post<VideoGenerationResponse>(
        "v1/videos/generate-from-template",
        body
      );
      return data;
    },

    async getVideoStatus(videoId: string): Promise<unknown> {
      const { data } = await client.get(`v1/videos/${videoId}/status`);
      return data;
    },

    async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
      const { data } = await client.get<TaskStatusResponse>(
        `v1/tasks/${encodeURIComponent(taskId)}/status`
      );
      return data;
    },

    async publishDistribution(
      body: PublishDistributionBody
    ): Promise<{ id: string; status: string }> {
      const { data } = await client.post<{ id: string; status: string }>(
        "distribution/publish",
        body
      );
      return data;
    },

    async getDistributionStatus(
      id: string
    ): Promise<{ id: string; status: string; deliveredAt?: string }> {
      const { data } = await client.get<{
        id: string;
        status: string;
        deliveredAt?: string;
      }>(`distribution/${id}/status`);
      return data;
    },

    async createCampaign(body: CreateCampaignBody): Promise<CampaignRecord> {
      const { data } = await client.post<CampaignRecord>(
        "attribution/campaigns",
        body
      );
      return data;
    },

    async listCampaigns(
      tenantId: string,
      options?: { limit?: number; offset?: number }
    ): Promise<CampaignRecord[]> {
      const params: Record<string, string | number> = { tenantId };
      if (options?.limit != null) params.limit = options.limit;
      if (options?.offset != null) params.offset = options.offset;
      const { data } = await client.get<CampaignRecord[]>(
        "attribution/campaigns",
        { params }
      );
      return data ?? [];
    },

    async getCampaign(id: string, tenantId: string): Promise<CampaignRecord> {
      const { data } = await client.get<CampaignRecord>(
        `attribution/campaigns/${id}`,
        { params: { tenantId } }
      );
      return data;
    },

    async getAttributionReport(
      campaignId: string,
      tenantId: string
    ): Promise<AttributionReport> {
      const { data } = await client.get<AttributionReport>(
        `attribution/campaigns/${campaignId}/report`,
        { params: { tenantId } }
      );
      return data;
    },

    async getBillingSummary(
      tenantId: string,
      from?: string,
      to?: string
    ): Promise<BillingSummary> {
      const params: Record<string, string> = { tenantId };
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await client.get<BillingSummary>("billing/summary", {
        params,
      });
      return data;
    },

    async getErpProducts(query?: ErpProductsQuery): Promise<ErpProduct[]> {
      const params = new URLSearchParams();
      if (query?.tenantId) params.set("tenantId", query.tenantId);
      if (query?.limit != null) params.set("limit", String(query.limit));
      if (query?.offset != null) params.set("offset", String(query.offset));
      const qs = params.toString();
      const url = qs ? `erp/products?${qs}` : "erp/products";
      const { data } = await client.get<ErpProduct[]>(url);
      return Array.isArray(data) ? data : [];
    },
  };
}

export const aiApiClient = createAiApiClient();
