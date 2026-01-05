import { IsString, IsNotEmpty, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';

export class CreateCustomClassDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  baseClass?: string;

  @IsObject()
  @IsOptional()
  features?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  @Min(4)
  @Max(20)
  hitDie?: number;

  @IsObject()
  @IsOptional()
  proficiencies?: Record<string, any>;

  @IsObject()
  @IsOptional()
  spellcasting?: Record<string, any>;
}

