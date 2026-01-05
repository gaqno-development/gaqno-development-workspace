import { Request } from 'express';

export interface AuthenticatedUser {
  sub?: string;
  tenantId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

