import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { of } from "rxjs";
import type { AxiosResponse } from "axios";
import { PipedriveApiService } from "./pipedrive-api.service";
import { DatabaseService } from "../database/db.service";
import type { PipedrivePersonSearchResponse } from "../common/types";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_TOKEN = "valid-access-token";
const REFRESHED_TOKEN = "refreshed-access-token";
const NOW = new Date();
const EXPIRES_VALID = new Date(NOW.getTime() + 10 * 60 * 1000);
const EXPIRES_EXPIRED = new Date(NOW.getTime() - 1 * 60 * 1000);

function axiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: {} as AxiosResponse<T>["config"],
  };
}

describe("PipedriveApiService", () => {
  let service: PipedriveApiService;
  let httpGetMock: jest.Mock;
  let httpPostMock: jest.Mock;
  let dbSelectMock: jest.Mock;
  let dbUpdateMock: jest.Mock;

  beforeEach(async () => {
    httpGetMock = jest.fn();
    httpPostMock = jest.fn();
    dbSelectMock = jest.fn();
    dbUpdateMock = jest.fn();

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve(dbSelectMock()),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve(dbUpdateMock()),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipedriveApiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map: Record<string, string> = {
                PIPEDRIVE_CLIENT_ID: "test-client-id",
                PIPEDRIVE_CLIENT_SECRET: "test-client-secret",
              };
              return map[key];
            }),
          },
        },
        {
          provide: HttpService,
          useValue: { get: httpGetMock, post: httpPostMock },
        },
        {
          provide: DatabaseService,
          useValue: { getDb: () => mockDb },
        },
      ],
    }).compile();

    service = module.get<PipedriveApiService>(PipedriveApiService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("searchPersonByPhone", () => {
    it("should use valid token and not call refresh when expiresAt is in the future", async () => {
      dbSelectMock.mockResolvedValue([
        {
          tenantId: TENANT_ID,
          accessToken: VALID_TOKEN,
          refreshToken: "refresh-tok",
          expiresAt: EXPIRES_VALID,
          apiDomain: "api.pipedrive.com",
        },
      ]);

      const searchResult: PipedrivePersonSearchResponse = {
        success: true,
        data: { items: [{ id: 1, name: "John" }] },
      };
      httpGetMock.mockReturnValue(of(axiosResponse(searchResult)));

      const result = await service.searchPersonByPhone(TENANT_ID, "5511999999999");

      expect(result).toEqual(searchResult);
      expect(httpPostMock).not.toHaveBeenCalled();
      expect(httpGetMock).toHaveBeenCalledTimes(1);
      expect(httpGetMock.mock.calls[0][1]?.headers?.Authorization).toBe(
        `Bearer ${VALID_TOKEN}`
      );
    });

    it("should refresh token when expiresAt is in the past and then search", async () => {
      dbSelectMock
        .mockResolvedValueOnce([
          {
            tenantId: TENANT_ID,
            accessToken: "expired-token",
            refreshToken: "refresh-tok",
            expiresAt: EXPIRES_EXPIRED,
            apiDomain: "api.pipedrive.com",
          },
        ])
        .mockResolvedValueOnce([
          {
            tenantId: TENANT_ID,
            accessToken: REFRESHED_TOKEN,
            refreshToken: "new-refresh-tok",
            expiresAt: new Date(NOW.getTime() + 3600 * 1000),
            apiDomain: "api.pipedrive.com",
          },
        ]);

      httpPostMock.mockReturnValue(
        of(
          axiosResponse({
            access_token: REFRESHED_TOKEN,
            refresh_token: "new-refresh-tok",
            expires_in: 3600,
            api_domain: "api.pipedrive.com",
          })
        )
      );

      const searchResult: PipedrivePersonSearchResponse = {
        success: true,
        data: { items: [{ id: 2, name: "Jane" }] },
      };
      httpGetMock.mockReturnValue(of(axiosResponse(searchResult)));

      const result = await service.searchPersonByPhone(TENANT_ID, "5511888888888");

      expect(result).toEqual(searchResult);
      expect(httpPostMock).toHaveBeenCalledTimes(1);
      expect(httpPostMock.mock.calls[0][0]).toContain("oauth.pipedrive.com");
      expect(dbUpdateMock).toHaveBeenCalled();
      expect(httpGetMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${REFRESHED_TOKEN}` },
        })
      );
    });
  });
});
