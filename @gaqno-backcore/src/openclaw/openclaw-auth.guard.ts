import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class OpenClawAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const expected = this.configService.get<string>('OPENCLAW_SERVICE_TOKEN');
    if (token !== expected) {
      throw new UnauthorizedException('Invalid OpenClaw token');
    }
    return true;
  }
}
