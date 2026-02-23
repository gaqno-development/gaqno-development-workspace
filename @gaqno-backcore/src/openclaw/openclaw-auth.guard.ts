import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class OpenClawAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    const expected = process.env.OPENCLAW_SERVICE_TOKEN;
    if (!expected) {
      throw new UnauthorizedException('OPENCLAW_SERVICE_TOKEN is not configured');
    }

    if (token !== expected) {
      throw new UnauthorizedException('Invalid OpenClaw service token');
    }

    return true;
  }
}
