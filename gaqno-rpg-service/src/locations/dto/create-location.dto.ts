import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum LocationType {
  DUNGEON = 'dungeon',
  CITY = 'city',
  REGION = 'region',
  LANDMARK = 'landmark',
  BUILDING = 'building'
}

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(LocationType)
  type: LocationType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsObject()
  @IsOptional()
  coordinates?: { x?: number; y?: number; z?: number };
}

