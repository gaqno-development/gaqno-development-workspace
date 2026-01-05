import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { LocationType } from './create-location.dto';

export class GenerateLocationDto {
  @IsEnum(LocationType)
  @IsNotEmpty()
  type: LocationType;

  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

