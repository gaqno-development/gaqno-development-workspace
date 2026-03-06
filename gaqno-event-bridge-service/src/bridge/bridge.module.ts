import { Module } from "@nestjs/common";
import { BridgeService } from "./bridge.service";

@Module({
  providers: [BridgeService],
})
export class BridgeModule {}
