import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Dnd5eService } from './dnd5e.service';
import { Dnd5eController } from './dnd5e.controller';
import { DatabaseModule } from '../database/db.module';

@Module({
  imports: [HttpModule, DatabaseModule],
  providers: [Dnd5eService],
  controllers: [Dnd5eController],
  exports: [Dnd5eService],
})
export class Dnd5eModule {}

