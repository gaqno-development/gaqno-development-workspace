export interface MessageReceivedEvent {
  tenantId: string;
  waId: string;
  conversationId: string;
}

export interface PipedrivePersonItem {
  id: number;
  name?: string;
  email?: Array<{ value: string; primary?: boolean }>;
  phone?: Array<{ value: string; primary?: boolean }>;
  [key: string]: unknown;
}

export interface PipedrivePersonSearchResponse {
  success: true;
  data: {
    items: PipedrivePersonItem[];
    additional_data?: { pagination?: { start: number; limit: number; more_items_in_collection: boolean } };
  };
}

export interface LeadEnrichedEvent {
  tenantId: string;
  conversationId: string;
  waId: string;
  person: PipedrivePersonItem | null;
  occurredAt: string;
}
