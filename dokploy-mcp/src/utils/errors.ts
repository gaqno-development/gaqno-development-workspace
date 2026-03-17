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
};

export function mapDokployError(error: unknown): DokployApiError {
  if (error instanceof DokployApiError) {
    return error;
  }
  if (error instanceof Response) {
    const statusCode = error.status;
    const code = STATUS_TO_CODE[statusCode] ?? (statusCode >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN');
    return new DokployApiError(
      `Request failed: ${error.status} ${error.statusText}`,
      statusCode,
      code
    );
  }
  if (error instanceof Error) {
    return new DokployApiError(error.message, 0, 'UNKNOWN');
  }
  return new DokployApiError(String(error), 0, 'UNKNOWN');
}

export function toMcpError(error: DokployApiError): { code: number; message: string } {
  const mcpCode = error.statusCode >= 400 && error.statusCode < 500 ? -32001 : -32603;
  return {
    code: mcpCode,
    message: error.message,
  };
}
