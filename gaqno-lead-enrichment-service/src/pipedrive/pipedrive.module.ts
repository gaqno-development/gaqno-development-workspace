import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PipedriveApiService } from "./pipedrive-api.service";

@Module({
  imports: [HttpModule.register({ timeout: 10000 })],
  providers: [PipedriveApiService],
  exports: [PipedriveApiService],
})
export class PipedriveModule {}
