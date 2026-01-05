import { IsString, IsObject, IsOptional, ValidateNested, IsNumber, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class DiceDto {
  @IsString()
  formula: string;

  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  @IsNumber()
  roll: number;

  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  @IsInt()
  natural: number;

  @IsOptional()
  @Transform(({ value }) => value ? (typeof value === 'string' ? parseFloat(value) : value) : undefined)
  @IsNumber()
  target?: number;
}

export class SubmitActionDto {
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  characterId?: string;

  @IsString()
  action: string;

  @ValidateNested()
  @Type(() => DiceDto)
  dice: DiceDto;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

