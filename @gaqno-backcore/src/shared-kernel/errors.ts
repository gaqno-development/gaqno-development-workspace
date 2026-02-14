export class DomainError extends Error {
  public readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

export class ConcurrencyError extends DomainError {
  constructor(aggregateId: string, expected: number, actual: number) {
    super(
      'Concurrency conflict aggregate ' + aggregateId + ' expected version ' + expected + ' got ' + actual,
      'CONCURRENCY_CONFLICT',
    );
    this.name = 'ConcurrencyError';
  }
}

export class OrgContextError extends DomainError {
  constructor(message: string) {
    super(message, 'ORG_CONTEXT_REQUIRED');
    this.name = 'OrgContextError';
  }
}

export class InsufficientCreditsError extends DomainError {
  constructor(orgId: string, required: number, available: number) {
    super(
      'Insufficient credits org ' + orgId + ' required ' + required + ' available ' + available,
      'INSUFFICIENT_CREDITS',
    );
    this.name = 'InsufficientCreditsError';
  }
}
