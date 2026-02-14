import { Module } from '@nestjs/common';
import { XSkillClient } from './xskill.client';

@Module({
  providers: [XSkillClient],
  exports: [XSkillClient],
})
export class XSkillModule {}
