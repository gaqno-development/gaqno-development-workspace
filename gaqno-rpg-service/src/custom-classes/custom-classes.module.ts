import { Module } from '@nestjs/common';
import { CustomClassesService } from './custom-classes.service';
import { CustomClassesController } from './custom-classes.controller';
import { Dnd5eModule } from '../dnd5e/dnd5e.module';
import { NarratorModule } from '../narrator/narrator.module';

@Module({
  imports: [Dnd5eModule, NarratorModule],
  controllers: [CustomClassesController],
  providers: [CustomClassesService],
  exports: [CustomClassesService]
})
export class CustomClassesModule {}

