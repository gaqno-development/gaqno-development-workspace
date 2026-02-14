export const EVENT_FLOW =
  'API Gateway is the only frontend boundary. Request hits service with x-org-id (and optional x-user-id, x-correlation-id). ' +
  'OrgGuard validates org and sets OrgContext on request. Controller extracts OrgContext and builds CommandWithContext. ' +
  'Command handler loads or creates aggregate, raises domain events; for each uncommitted event: EventRepository.append (encrypt payload, insert into events table scoped by orgId) then KafkaProducer.publish to the topic. ' +
  'Consumers receive from Kafka, decrypt payload by orgId, and process; no BullMQ for domain events; Redis is for cache only.';
