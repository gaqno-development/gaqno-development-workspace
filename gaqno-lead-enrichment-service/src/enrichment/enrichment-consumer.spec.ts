import { Test, TestingModule } from "@nestjs/testing";
import { KafkaConsumer } from "@gaqno-development/backcore";
import { EnrichmentConsumerService, KAFKA_PRODUCER } from "./enrichment-consumer.service";
import { PipedriveApiService } from "../pipedrive/pipedrive-api.service";
import { TopicNames } from "../common/topics";
import type { PipedrivePersonSearchResponse } from "../common/types";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
const WA_ID = "5511999999999";
const CONVERSATION_ID = "conv-123";

describe("EnrichmentConsumerService", () => {
  let service: EnrichmentConsumerService;
  let pipedriveSearchMock: jest.Mock;
  let kafkaPublishRawMock: jest.Mock;

  function messagePayload(value: string) {
    return {
      topic: TopicNames.MESSAGE_RECEIVED,
      key: null,
      value,
      headers: {} as Record<string, string>,
    };
  }

  beforeEach(async () => {
    pipedriveSearchMock = jest.fn();
    kafkaPublishRawMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrichmentConsumerService,
        {
          provide: PipedriveApiService,
          useValue: { searchPersonByPhone: pipedriveSearchMock },
        },
        {
          provide: KAFKA_PRODUCER,
          useValue: { publishRaw: kafkaPublishRawMock },
        },
        {
          provide: KafkaConsumer,
          useValue: {
            connect: jest.fn().mockResolvedValue(undefined),
            subscribe: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<EnrichmentConsumerService>(EnrichmentConsumerService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("handleMessageReceived", () => {
    it("should call Pipedrive search and emit LEAD_ENRICHED on success", async () => {
      const person = { id: 1, name: "John", email: [{ value: "john@example.com" }] };
      const searchResult: PipedrivePersonSearchResponse = {
        success: true,
        data: { items: [person] },
      };
      pipedriveSearchMock.mockResolvedValue(searchResult);

      await service.handleMessageReceived(
        messagePayload(
          JSON.stringify({
            tenantId: TENANT_ID,
            waId: WA_ID,
            conversationId: CONVERSATION_ID,
          })
        )
      );

      expect(pipedriveSearchMock).toHaveBeenCalledWith(TENANT_ID, WA_ID);
      expect(kafkaPublishRawMock).toHaveBeenCalledTimes(1);
      expect(kafkaPublishRawMock.mock.calls[0][0]).toBe(TopicNames.LEAD_ENRICHED);
      const emittedPayload = JSON.parse(kafkaPublishRawMock.mock.calls[0][2]);
      expect(emittedPayload.tenantId).toBe(TENANT_ID);
      expect(emittedPayload.conversationId).toBe(CONVERSATION_ID);
      expect(emittedPayload.waId).toBe(WA_ID);
      expect(emittedPayload.person).toEqual(person);
      expect(emittedPayload.occurredAt).toBeDefined();
    });

    it("should throw when Pipedrive returns 429 so message is not committed", async () => {
      const err = Object.assign(new Error("Too Many Requests"), {
        response: { status: 429 },
      });
      pipedriveSearchMock.mockRejectedValue(err);

      await expect(
        service.handleMessageReceived(
          messagePayload(
            JSON.stringify({
              tenantId: TENANT_ID,
              waId: WA_ID,
              conversationId: CONVERSATION_ID,
            })
          )
        )
      ).rejects.toThrow();

      expect(kafkaPublishRawMock).not.toHaveBeenCalled();
    });
  });
});
