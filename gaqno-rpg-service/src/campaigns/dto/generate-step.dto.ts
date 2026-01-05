import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum CampaignStep {
  CONCEPT = 'concept',
  WORLD = 'world',
  NARRATIVE = 'narrative',
  NPCS = 'npcs',
  HOOKS = 'hooks',
}

export class GenerateStepDto {
  @IsEnum(CampaignStep)
  step: CampaignStep;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @IsOptional()
  @IsObject()
  existingContent?: Record<string, any>;

  @IsOptional()
  @IsString()
  seed?: string;
}

