import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { OpenClawAuthGuard } from '../src/openclaw/openclaw-auth.guard';

describe('OpenClawAuthGuard', () => {
  const validToken = 'openclaw-secret-token-123';
  let guard: OpenClawAuthGuard;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;

  function createMockContext(headers: Request['headers']): ExecutionContext {
    const request = { headers } as Request;
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    configService = { get: jest.fn().mockReturnValue(validToken) };
    guard = new OpenClawAuthGuard(configService as unknown as ConfigService);
  });

  it('should throw UnauthorizedException when no Authorization header is sent', () => {
    const ctx = createMockContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx)).toThrow(/authorization/i);
  });

  it('should throw UnauthorizedException when token is invalid', () => {
    const ctx = createMockContext({
      authorization: 'Bearer wrong-token',
    });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx)).toThrow(/invalid/i);
  });

  it('should return true when token matches OPENCLAW_SERVICE_TOKEN', () => {
    const ctx = createMockContext({
      authorization: `Bearer ${validToken}`,
    });
    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
  });
});
