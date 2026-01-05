import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class GenerateCustomClassDto {
  @IsString()
  @IsNotEmpty()
  baseClass: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  theme?: string;

  @IsObject()
  @IsOptional()
  modifications?: Record<string, any>;
}

