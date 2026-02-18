import { NestFactory } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/db.module";
import { PipedriveModule } from "../pipedrive/pipedrive.module";
import { PipedriveApiService } from "../pipedrive/pipedrive-api.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    DatabaseModule,
    PipedriveModule,
  ],
})
class PipedriveTestModule {}

async function main(): Promise<void> {
  const tenantId = process.env.TENANT_ID;
  const phone = process.env.PHONE ?? process.argv[2];

  if (!tenantId || !phone) {
    console.error(
      "Usage: TENANT_ID=<uuid> PHONE=<number> node dist/scripts/pipedrive-search-manual.js [phone]"
    );
    console.error("  Or ensure DATABASE_URL, PIPEDRIVE_CLIENT_ID, PIPEDRIVE_CLIENT_SECRET are set.");
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(PipedriveTestModule, {
    logger: ["error", "warn"],
  });

  const service = app.get(PipedriveApiService);

  try {
    const result = await service.searchPersonByPhone(tenantId, phone);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
