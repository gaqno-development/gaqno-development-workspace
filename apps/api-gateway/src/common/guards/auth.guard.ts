import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const orgId = request.headers['x-org-id'];
    const userId = request.headers['x-user-id'];
    if (typeof orgId !== 'string' || !orgId.trim()) {
      throw new UnauthorizedException('x-org-id required');
    }
    if (typeof userId !== 'string' || !userId.trim()) {
      throw new UnauthorizedException('x-user-id required');
    }
    return true;
  }
}
