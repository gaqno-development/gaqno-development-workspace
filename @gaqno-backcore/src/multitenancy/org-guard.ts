import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import type { OrgContext } from './org-context';
import { ORG_HEADER, USER_HEADER, CORRELATION_HEADER, createOrgContext } from './org-context';
import { OrgContextError } from '../shared-kernel/errors';

export const ORG_CONTEXT_KEY = 'ORG_CONTEXT';

@Injectable()
export class OrgGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const existing = (request as Request & { [ORG_CONTEXT_KEY]?: OrgContext })[ORG_CONTEXT_KEY];
    if (existing?.orgId) {
      return true;
    }
    const orgId = request.headers[ORG_HEADER] as string | undefined;
    const userId = request.headers[USER_HEADER] as string | undefined;
    const correlationId = request.headers[CORRELATION_HEADER] as string | undefined;
    if (typeof orgId !== 'string' || !orgId.trim()) {
      throw new UnauthorizedException(`${ORG_HEADER} required`);
    }
    const ctx: OrgContext = createOrgContext({
      orgId: orgId.trim(),
      userId: typeof userId === 'string' ? userId.trim() : undefined,
      correlationId: typeof correlationId === 'string' ? correlationId.trim() : undefined,
    });
    (request as Request & { [ORG_CONTEXT_KEY]: OrgContext })[ORG_CONTEXT_KEY] = ctx;
    return true;
  }
}

export function getOrgContext(request: Request): OrgContext {
  const ctx = (request as Request & { [ORG_CONTEXT_KEY]?: OrgContext })[ORG_CONTEXT_KEY];
  if (!ctx?.orgId) {
    throw new OrgContextError('Org context not set; ensure OrgGuard is applied');
  }
  return ctx;
}
