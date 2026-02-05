import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 4012;
  const corsOrigin = process.env.CORS_ORIGIN ?? "*";

  app.enableCors({
    origin:
      corsOrigin === "*" ? true : corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.listen(port);
  console.log(`Warehouse Service is running on: http://localhost:${port}`);
}

bootstrap();
