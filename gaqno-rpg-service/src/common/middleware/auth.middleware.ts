import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/request.types';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.gaqno_session || req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            
            if (payload) {
              req.user = {
                sub: payload.sub,
                tenantId: payload.tenantId,
              };
            }
          }
        } catch (error) {
          console.warn('Failed to decode token:', error);
        }
      }

      next();
    } catch (error) {
      next();
    }
  }
}

