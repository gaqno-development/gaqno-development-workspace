export type OpenClawAction = string;

export type OpenClawRequestPayload = {
  tenantId: string;
  action: OpenClawAction;
  parameters: Record<string, unknown>;
};

export type OpenClawResponseBase<T = unknown> = {
  success: boolean;
  data: T;
  message?: string;
};
