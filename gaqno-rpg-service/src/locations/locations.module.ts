import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { Dnd5eModule } from '../dnd5e/dnd5e.module';
import { NarratorModule } from '../narrator/narrator.module';

@Module({
  imports: [Dnd5eModule, NarratorModule],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService]
})
export class LocationsModule {}

