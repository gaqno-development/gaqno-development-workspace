export {
  createAxiosClient,
  apiClient,
  createServiceClient,
  ssoClient,
  financeClient,
  coreAxiosClient,
  getAuthToken,
  registerServiceConfig,
  type ServiceConfig,
} from "./api-client";

export { ssoAxiosClient } from "./sso-client";

export {
  createAiApiClient,
  aiApiClient,
  type BuildProductProfileRequest,
  type ProductProfileResponse,
  type ProductProfileRequestProduct,
  type SemanticFieldValue,
  type GenerateContentRequest,
  type GenerateContentResponse,
  type GenerateContentProductInput,
  type PublishDistributionBody,
  type CreateCampaignBody,
  type GenerateVideoFromTemplateBody,
  type ErpProduct,
  type ErpProductsQuery,
  type TaskStatusResponse,
  type ImageGenerationTaskResponse,
} from "./aiApiClient";
export type {
  CampaignRecord,
  AttributionReport,
  BillingSummary,
} from "./aiApiClient";
export type {
  VideoTemplateSummary,
  VideoGenerationResponse,
} from "./aiApiClient";
