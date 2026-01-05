import { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DiceDto {
  @IsString()
  formula: string;

  roll: number;

  natural: number;

  @IsOptional()
  target?: string | number;
}

class ContextDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  npc?: string;

  @IsOptional()
  @IsString()
  target_dc?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  masterEvent?: boolean;
}

export class NarrateActionDto {
  @IsString()
  player_id: string;

  @IsString()
  action: string;

  @ValidateNested()
  @Type(() => DiceDto)
  dice: DiceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContextDto)
  context?: ContextDto;

  @IsOptional()
  @IsObject()
  character_sheet?: Record<string, any>;

  @IsOptional()
  @IsObject()
  session_memory?: Record<string, any>;
}

