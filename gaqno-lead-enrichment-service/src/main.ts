import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

function registerProcessHandlers(): void {
  process.on("unhandledRejection", (reason: unknown) => {
    const err = reason as { code?: number; retriable?: boolean };
    if (typeof err?.code === "number" && err.retriable === true) {
      return;
    }
    console.error("Unhandled rejection:", reason);
  });
}

async function bootstrap(): Promise<void> {
  registerProcessHandlers();
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>("PORT") ?? 4010;
  await app.listen(port, "0.0.0.0");
}

bootstrap();
