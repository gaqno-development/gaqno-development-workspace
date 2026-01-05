import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { DatabaseModule } from '../database/db.module';
import { NarratorModule } from '../narrator/narrator.module';
import { Dnd5eModule } from '../dnd5e/dnd5e.module';

@Module({
  imports: [DatabaseModule, NarratorModule, Dnd5eModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}

