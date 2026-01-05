import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  const corsOrigin = process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS;
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:3007', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005', 'http://localhost:3006'];
  const allowedOriginsList = !corsOrigin || corsOrigin === '*'
    ? defaultOrigins
    : corsOrigin.split(',').map((item) => item.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (!corsOrigin || corsOrigin === '*' || allowedOriginsList.includes(origin)) {
        callback(null, origin);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Referer', 'User-Agent', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cookieParser());

  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('v1/rpg');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraints = error.constraints || {};
          return Object.values(constraints).join(', ');
        });
        return new Error(`Erro de validação: ${messages.join('; ')}`);
      },
    }),
  );

  const port = process.env.PORT || 4007;
  await app.listen(port);
  console.log(`RPG Service is running on: http://localhost:${port}`);
}
bootstrap();

