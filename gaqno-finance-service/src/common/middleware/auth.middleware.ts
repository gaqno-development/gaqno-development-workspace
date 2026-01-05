import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/request.types';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Tenta extrair o token do cookie
      const token = req.cookies?.gaqno_session || req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        try {
          // Decodifica o JWT sem verificar (já que pode estar vindo de outro serviço)
          // JWT no formato: header.payload.signature
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
          // Se falhar ao decodificar, continua sem usuário
          console.warn('Failed to decode token:', error);
        }
      }

      next();
    } catch (error) {
      next();
    }
  }
}

