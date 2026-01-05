import { IsString, IsEnum, IsObject } from 'class-validator';
import { CampaignStep } from './generate-step.dto';

export class UpdateStepDto {
  @IsEnum(CampaignStep)
  step: CampaignStep;

  @IsObject()
  content: Record<string, any>;
}

