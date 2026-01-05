import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsObject()
  concept?: Record<string, any>;

  @IsOptional()
  @IsObject()
  world?: Record<string, any>;

  @IsOptional()
  @IsObject()
  initialNarrative?: Record<string, any>;

  @IsOptional()
  @IsObject()
  npcs?: any[];

  @IsOptional()
  @IsObject()
  hooks?: any[];
}

