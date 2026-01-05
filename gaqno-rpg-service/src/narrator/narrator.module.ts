import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NarratorController } from './narrator.controller';
import { NarratorService } from './narrator.service';
import { ImageService } from './image.service';

@Module({
  imports: [HttpModule],
  controllers: [NarratorController],
  providers: [NarratorService, ImageService],
  exports: [NarratorService, ImageService]
})
export class NarratorModule {}

