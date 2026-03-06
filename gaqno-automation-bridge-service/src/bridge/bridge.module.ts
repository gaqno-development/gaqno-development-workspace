import { Module } from "@nestjs/common";
import { AutomationBridgeService } from "./automation-bridge.service";

@Module({
  providers: [AutomationBridgeService],
})
export class BridgeModule {}
