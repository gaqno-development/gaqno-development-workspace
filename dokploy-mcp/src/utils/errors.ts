export class DokployApiError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'DokployApiError';
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, DokployApiError.prototype);
  }
}

const STATUS_TO_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  429: 'RATE_LIMITED',
};

const USER_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Invalid API key. Check DOKPLOY_API_KEY.',
  FORBIDDEN: 'Permission denied. User lacks access.',
  NOT_FOUND: 'Resource not found (project/app/db). Verify ID.',
  BAD_REQUEST: 'Invalid parameters. Check tool inputs.',
  CONFLICT: 'Resource conflict. The operation cannot be completed.',
  UNPROCESSABLE: 'Validation failed. Check the provided data.',
  RATE_LIMITED: 'Too many requests. Try again later.',
  INTERNAL_ERROR: 'Dokploy API internal error. Try again.',
  NETWORK_ERROR: 'Dokploy API unreachable. Check DOKPLOY_BASE_URL.',
};

const MCP_ERROR_CODES: Record<string, number> = {
  UNAUTHORIZED: -32001,
  FORBIDDEN: -32002,
  NOT_FOUND: -32602,
  BAD_REQUEST: -32602,
  CONFLICT: -32602,
  UNPROCESSABLE: -32602,
  RATE_LIMITED: -32603,
  INTERNAL_ERROR: -32603,
  NETWORK_ERROR: -32603,
  UNKNOWN: -32603,
};

export async function mapDokployError(error: unknown): Promise<DokployApiError> {
  if (error instanceof DokployApiError) {
    return error;
  }
  if (error instanceof Response) {
    const statusCode = error.status;
    const code = STATUS_TO_CODE[statusCode] ?? (statusCode >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN');
    let body = '';
    try {
      body = await error.text();
    } catch {
      /* ignore */
    }
    const userMessage = USER_MESSAGES[code] ?? `Request failed: ${statusCode} ${error.statusText}`;
    const detail = body ? ` (${body.slice(0, 200)})` : '';
    return new DokployApiError(`${userMessage}${detail}`, statusCode, code);
  }
  if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
    return new DokployApiError(USER_MESSAGES.NETWORK_ERROR, 0, 'NETWORK_ERROR');
  }
  if (error instanceof Error) {
    return new DokployApiError(error.message, 0, 'UNKNOWN');
  }
  return new DokployApiError(String(error), 0, 'UNKNOWN');
}

export function toMcpError(error: DokployApiError): { code: number; message: string } {
  return {
    code: MCP_ERROR_CODES[error.code] ?? -32603,
    message: error.message,
  };
}
