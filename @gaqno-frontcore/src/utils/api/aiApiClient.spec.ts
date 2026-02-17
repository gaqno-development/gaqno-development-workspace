import type { AxiosInstance } from "axios";
import { createAiApiClient } from "./aiApiClient";

describe("createAiApiClient", () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockClient = {
    get: mockGet,
    post: mockPost,
  } as unknown as AxiosInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: {} });
    mockPost.mockResolvedValue({ data: {} });
  });

  it("should return an object with all retail AI methods", () => {
    const client = createAiApiClient(mockClient);
    expect(client).toHaveProperty("buildProductProfile");
    expect(client).toHaveProperty("generateProductContent");
    expect(client).toHaveProperty("getVideoModels");
    expect(client).toHaveProperty("getVideoTemplates");
    expect(client).toHaveProperty("generateVideoFromTemplate");
    expect(client).toHaveProperty("getVideoStatus");
    expect(client).toHaveProperty("publishDistribution");
    expect(client).toHaveProperty("getDistributionStatus");
    expect(client).toHaveProperty("createCampaign");
    expect(client).toHaveProperty("listCampaigns");
    expect(client).toHaveProperty("getCampaign");
    expect(client).toHaveProperty("getAttributionReport");
    expect(client).toHaveProperty("getBillingSummary");
    expect(client).toHaveProperty("getErpProducts");
  });

  it("should call buildProductProfile with product-profile/build", async () => {
    const client = createAiApiClient(mockClient);
    const request = {
      product: {
        id: "1",
        name: "Test",
        price: 10,
        tenantId: "t1",
      },
      inferMissing: true,
    };
    mockPost.mockResolvedValue({
      data: {
        productId: "1",
        tenantId: "t1",
        profile: {},
        overallConfidence: 0.9,
      },
    });
    await client.buildProductProfile(request);
    expect(mockPost).toHaveBeenCalledWith("product-profile/build", request);
  });

  it("should call generateProductContent with product-content/generate", async () => {
    const client = createAiApiClient(mockClient);
    const request = {
      product: {
        id: "1",
        name: "Test",
        price: 10,
        tenantId: "t1",
      },
    };
    mockPost.mockResolvedValue({ data: { copy: "Copy", assumptions: [] } });
    await client.generateProductContent(request);
    expect(mockPost).toHaveBeenCalledWith("product-content/generate", request);
  });

  it("should call getVideoTemplates with v1/videos/templates", async () => {
    const client = createAiApiClient(mockClient);
    mockGet.mockResolvedValue({ data: [] });
    await client.getVideoTemplates();
    expect(mockGet).toHaveBeenCalledWith("v1/videos/templates");
  });

  it("should call getBillingSummary with billing/summary and params", async () => {
    const client = createAiApiClient(mockClient);
    mockGet.mockResolvedValue({
      data: {
        gmv: 0,
        currency: "BRL",
        period: { from: "2025-01-01", to: "2025-01-31" },
        transactionCount: 0,
        feeRatePercent: 1,
        feeAmount: 0,
      },
    });
    await client.getBillingSummary("tenant-1", "2025-01-01", "2025-01-31");
    expect(mockGet).toHaveBeenCalledWith("billing/summary", {
      params: { tenantId: "tenant-1", from: "2025-01-01", to: "2025-01-31" },
    });
  });
});
