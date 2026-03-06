import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>("PORT") ?? 4021;
  await app.listen(port, "0.0.0.0");
  console.log(`Automation Bridge Service running on http://0.0.0.0:${port}`);
}

bootstrap();
